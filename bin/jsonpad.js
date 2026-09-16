#!/usr/bin/env node
'use strict';

/**
 * The jsonpad command line tool
 *
 * Plain CommonJS on top of the built SDK, so it needs nothing but Node 18.3 or
 * later (for fetch and util.parseArgs). Run `jsonpad --help` for usage
 *
 * Deprecated: this command has moved to @basementuniverse/jsonpad-cli, and
 * will be removed in 2.0.0. It gets no new commands
 */

const fs = require('fs');
const path = require('path');
const { parseArgs } = require('util');
const sdk = require('../build/jsonpad-sdk.js');
const { version } = require('../package.json');

const JSONPad = sdk.default;
const { IndexBuildError, JSONPadError } = sdk;

const DEFAULT_SCHEMA_FILE = 'jsonpad-schema.json';

const EXIT_OK = 0;
const EXIT_ERROR = 1;
const EXIT_REBUILD_NOT_ALLOWED = 2;
const EXIT_BUILD_FAILED = 3;
const EXIT_DESTRUCTIVE_NOT_ALLOWED = 4;

const HELP = `jsonpad ${version}

Usage: jsonpad <command> [options]

Commands:
  sync-schema [file]            Create and update lists and indexes to match a
                                schema document (default: ${DEFAULT_SCHEMA_FILE})
    --dry-run                   Show what would change, without changing it
    --allow-rebuild             Allow changes that rebuild an index in a list
                                with items (the index can't be used until the
                                rebuild finishes)
    --prune                     Also delete the lists and indexes the document's
                                scope manages that it no longer declares
    --allow-destructive         Allow a prune to delete lists that have items,
                                and guard indexes
    --wait                      Wait for index builds to finish
    --timeout <seconds>         How long --wait waits for each index (default 600)
    --show-unchanged            Also list resources that don't change
    --json                      Print the API's response as JSON

  export-schema                 Write a schema document for existing lists
    --scope <scope>             Only lists managed by this scope
    --tagged <tags>             Only lists with one of these comma-separated
                                tags (repeat the option to require every group)
    --lists <path names>        Only these comma-separated lists
    --out <file>                Write the document to a file, not stdout

  move-lists [list...]          Move lists (by id or path name) to a scope, or
                                release them from their scope
    --to <scope>                The scope to move the lists to
    --release                   Release the lists from their scope instead
    --from-scope <scope>        Move every list this scope manages, instead of
                                naming lists (e.g. to rename the scope)
    --dry-run                   Show what would change, without changing it
    --json                      Print the API's response as JSON

  rebuild-index <list> <index>  Rebuild an index whose last build failed, once
                                the problem has been fixed
    --wait                      Wait for the build to finish
    --timeout <seconds>         How long to wait (default 600)

Options:
  -h, --help                    Show this help
  -v, --version                 Show the version

Environment:
  JSONPAD_TOKEN                 The API token to use (required). The token needs
                                the sync-schema permission, plus permission for
                                each change a sync makes
  JSONPAD_API_URL               The API's URL (default https://api.jsonpad.io)
  NO_COLOR                      Set to turn off coloured output

Exit codes:
  0  Success
  1  Error, including a sync refused because a change has errors
  2  A sync was refused because it needs --allow-rebuild
  3  An index build failed, or didn't finish in time, while waiting
  4  A sync was refused because it needs --allow-destructive
`;

// -----------------------------------------------------------------------------
// Output
// -----------------------------------------------------------------------------

const useColour = !!process.stdout.isTTY && !('NO_COLOR' in process.env);

function colour(code, text) {
  return useColour ? `\x1b[${code}m${text}\x1b[0m` : text;
}

const green = text => colour(32, text);
const yellow = text => colour(33, text);
const red = text => colour(31, text);
const cyan = text => colour(36, text);
const dim = text => colour(2, text);
const bold = text => colour(1, text);

function formatValue(value) {
  const json = JSON.stringify(value);

  return json !== undefined && json.length > 60
    ? `${json.slice(0, 57)}...`
    : String(json);
}

class CliError extends Error {
  constructor(message, exitCode = EXIT_ERROR) {
    super(message);
    this.exitCode = exitCode;
  }
}

function describeApiError(error) {
  if (error instanceof JSONPadError) {
    try {
      return JSON.parse(error.message).message || error.message;
    } catch {
      return `The API responded with status ${error.status}`;
    }
  }

  return error && error.message ? error.message : String(error);
}

// -----------------------------------------------------------------------------
// Setup
// -----------------------------------------------------------------------------

/**
 * Tell people running this by hand that the command has moved. The notice goes
 * to stderr, so output and exit codes don't change, and it's left out of CI
 * logs, where nobody would act on it
 */
function printDeprecationNotice() {
  const ci = (process.env.CI || '').toLowerCase();

  if (
    (ci && ci !== 'false' && ci !== '0') ||
    process.env.JSONPAD_NO_DEPRECATION
  ) {
    return;
  }

  console.error(
    yellow(
      'The jsonpad command has moved to @basementuniverse/jsonpad-cli, and will be removed from @basementuniverse/jsonpad-sdk in 2.0.0. Run npx @basementuniverse/jsonpad-cli, or npm install -g @basementuniverse/jsonpad-cli'
    )
  );
}

function createClient() {
  const token = process.env.JSONPAD_TOKEN;

  if (!token) {
    throw new CliError(
      'Set the JSONPAD_TOKEN environment variable to an API token'
    );
  }

  return new JSONPad(token, undefined, undefined, {
    apiUrl: process.env.JSONPAD_API_URL || undefined,
  });
}

function parseTimeout(value) {
  if (value === undefined) {
    return 600 * 1000;
  }

  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new CliError('--timeout must be a number of seconds');
  }

  return seconds * 1000;
}

async function waitForIndexes(jsonpad, indexes, timeout) {
  let failed = false;

  // Builds for one account run one at a time, so waiting for them in order
  // doesn't slow anything down, and polls less than waiting for all at once
  for (const { listId, indexId, label } of indexes) {
    process.stdout.write(`Waiting for index ${label} to build... `);

    try {
      await jsonpad.waitForIndex(listId, indexId, { timeout });
      process.stdout.write(`${green('ready')}\n`);
    } catch (error) {
      failed = true;

      if (error instanceof IndexBuildError) {
        process.stdout.write(
          `${red(error.reason === 'failed' ? 'failed' : 'timed out')}\n`
        );
      } else {
        process.stdout.write(`${red('error')}: ${describeApiError(error)}\n`);
      }
    }
  }

  if (failed) {
    throw new CliError(
      'One or more indexes did not build. Fix the problem, then run jsonpad rebuild-index <list> <index>',
      EXIT_BUILD_FAILED
    );
  }
}

// -----------------------------------------------------------------------------
// sync-schema
// -----------------------------------------------------------------------------

const ACTION_SYMBOLS = {
  create: green('+'),
  update: yellow('~'),
  adopt: cyan('@'),
  delete: red('-'),
  'no-change': dim('='),
  error: red('!'),
};

function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function printChange(change) {
  const name =
    change.resourceType === 'list'
      ? `list ${bold(change.list)}`
      : `index ${bold(`${change.list}/${change.index}`)}`;
  const action = change.action === 'no-change' ? 'no change' : change.action;
  const build = change.build
    ? dim(
        ` (${change.build.reason === 'created' ? 'build' : 'rebuild'}: ${
          change.build.items
        } ${change.build.items === 1 ? 'item' : 'items'}${
          change.build.requiresConfirmation ? ', needs --allow-rebuild' : ''
        })`
      )
    : '';
  const deleteDetails = change.delete
    ? [
        ...(change.delete.items !== undefined
          ? [plural(change.delete.items, 'item')]
          : []),
        ...(change.delete.indexes !== undefined
          ? [plural(change.delete.indexes, 'index', 'indexes')]
          : []),
        ...(change.delete.destructive ? ['needs --allow-destructive'] : []),
      ]
    : [];
  const deleted =
    deleteDetails.length > 0 ? dim(` (${deleteDetails.join(', ')})`) : '';

  console.log(
    `${ACTION_SYMBOLS[change.action]} ${name} ${dim(action)}${build}${deleted}`
  );

  for (const [field, { from, to }] of Object.entries(change.fields || {})) {
    console.log(
      change.action === 'create'
        ? `    ${field}: ${formatValue(to)}`
        : `    ${field}: ${formatValue(from)} ${dim('->')} ${formatValue(to)}`
    );
  }

  for (const warning of change.warnings || []) {
    console.log(`    ${yellow('warning')}: ${warning}`);
  }

  for (const error of change.errors || []) {
    console.log(`    ${red('error')}: ${error.message}`);
  }
}

function printSummary(result) {
  const { summary } = result;
  const parts = [
    `${summary.create} to create`,
    `${summary.update} to update`,
    `${summary.adopt} to adopt`,
    ...(result.prune ? [`${summary.delete} to delete`] : []),
    `${summary.noChange} unchanged`,
  ];

  if (summary.error > 0) {
    parts.push(red(`${summary.error} with errors`));
  }

  console.log(`\n${parts.join(', ')}`);
}

async function syncSchema(positionals, values) {
  const file = positionals[0] || DEFAULT_SCHEMA_FILE;
  let document;

  try {
    document = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
  } catch (error) {
    throw new CliError(
      error.code === 'ENOENT'
        ? `Can't find ${file}`
        : `Can't read ${file}: ${error.message}`
    );
  }

  const jsonpad = createClient();
  let result;

  try {
    result = await jsonpad.syncSchema(document, {
      dryRun: !!values['dry-run'],
      allowRebuild: !!values['allow-rebuild'],
      prune: !!values.prune,
      allowDestructive: !!values['allow-destructive'],
    });
  } catch (error) {
    throw new CliError(describeApiError(error));
  }

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const heading = result.dryRun
      ? 'Schema sync plan (dry run)'
      : 'Schema sync';
    console.log(
      bold(heading) + (result.scope ? dim(` for scope ${result.scope}`) : '')
    );
    console.log('');

    // Unchanged resources are hidden unless they have something to say, e.g.
    // an index whose last build failed
    const shown = result.changes.filter(
      change =>
        values['show-unchanged'] ||
        change.action !== 'no-change' ||
        (change.warnings && change.warnings.length > 0)
    );
    if (shown.length === 0) {
      console.log(dim('Nothing to change'));
    }
    shown.forEach(printChange);

    printSummary(result);
  }

  if (result.blockedBy) {
    // The API's message names the query parameter, not the CLI option
    const flags = {
      SCHEMA_SYNC_REBUILD_NOT_ALLOWED: {
        parameter: 'allowRebuild',
        option: '--allow-rebuild',
        exitCode: EXIT_REBUILD_NOT_ALLOWED,
      },
      SCHEMA_SYNC_DESTRUCTIVE_NOT_ALLOWED: {
        parameter: 'allowDestructive',
        option: '--allow-destructive',
        exitCode: EXIT_DESTRUCTIVE_NOT_ALLOWED,
      },
    };
    const flag = flags[result.blockedBy.name];
    const message = flag
      ? `${result.blockedBy.message.replace(
          ` (pass ${flag.parameter}=true to allow this)`,
          ''
        )}. Run again with ${flag.option} to allow this`
      : result.blockedBy.message;

    throw new CliError(
      result.dryRun ? `A real sync would be refused: ${message}` : message,
      flag ? flag.exitCode : EXIT_ERROR
    );
  }

  if (!values.json) {
    const { create, update, adopt } = result.summary;
    const deletes = result.summary.delete || 0;

    if (create + update + adopt + deletes === 0) {
      console.log(green('Already up to date'));
    } else {
      console.log(
        result.applied ? green('Applied') : dim('Not applied (dry run)')
      );
    }
  }

  if (result.applied && values.wait) {
    const building = result.changes
      .filter(change => change.build && change.build.buildStatus === 'building')
      .map(change => ({
        listId: change.listId,
        indexId: change.indexId,
        label: `${change.list}/${change.index}`,
      }));

    await waitForIndexes(jsonpad, building, parseTimeout(values.timeout));
  }
}

// -----------------------------------------------------------------------------
// export-schema
// -----------------------------------------------------------------------------

async function exportSchema(positionals, values) {
  const jsonpad = createClient();
  let result;

  try {
    result = await jsonpad.exportSchema({
      scope: values.scope,
      tagged: values.tagged,
      lists: values.lists
        ? values.lists
            .split(',')
            .map(pathName => pathName.trim())
            .filter(Boolean)
        : undefined,
    });
  } catch (error) {
    throw new CliError(describeApiError(error));
  }

  for (const warning of result.warnings) {
    console.error(`${yellow('warning')}: ${warning}`);
  }

  const json = `${JSON.stringify(result.document, null, 2)}\n`;

  if (values.out) {
    fs.writeFileSync(path.resolve(values.out), json);
    console.error(
      `Wrote ${Object.keys(result.document.lists).length} lists to ${
        values.out
      }`
    );
  } else {
    process.stdout.write(json);
  }
}

// -----------------------------------------------------------------------------
// move-lists
// -----------------------------------------------------------------------------

const MOVE_ACTION_SYMBOLS = {
  move: cyan('>'),
  assign: green('+'),
  release: yellow('-'),
  'no-change': dim('='),
  error: red('!'),
};

const scopeName = scope => (scope === null ? dim('no scope') : scope);

function printMoveChange(change) {
  const action = change.action === 'no-change' ? 'no change' : change.action;
  const scopes =
    change.from !== undefined && change.action !== 'no-change'
      ? ` ${scopeName(change.from)} ${dim('->')} ${scopeName(change.to)}`
      : '';
  const indexes =
    change.indexes !== undefined
      ? dim(` (${plural(change.indexes, 'index', 'indexes')})`)
      : '';

  console.log(
    `${MOVE_ACTION_SYMBOLS[change.action]} list ${bold(change.list)} ${dim(
      action
    )}${scopes}${indexes}`
  );

  for (const [field, { from, to }] of Object.entries(change.fields || {})) {
    console.log(
      `    ${field}: ${formatValue(from)} ${dim('->')} ${formatValue(to)}`
    );
  }

  for (const warning of change.warnings || []) {
    console.log(`    ${yellow('warning')}: ${warning}`);
  }

  for (const error of change.errors || []) {
    console.log(`    ${red('error')}: ${error.message}`);
  }
}

async function moveLists(positionals, values) {
  const usage =
    'Usage: jsonpad move-lists [list...] (--to <scope> | --release) [--from-scope <scope>]';

  if (!!values.to === !!values.release) {
    throw new CliError(`Pass either --to <scope> or --release. ${usage}`);
  }

  if (positionals.length > 0 === !!values['from-scope']) {
    throw new CliError(
      `Name the lists to move, or pass --from-scope, but not both. ${usage}`
    );
  }

  const jsonpad = createClient();
  const selection = values['from-scope']
    ? { fromScope: values['from-scope'] }
    : { lists: positionals };
  let result;

  try {
    result = await jsonpad.moveLists(
      selection,
      values.release ? null : values.to,
      { dryRun: !!values['dry-run'] }
    );
  } catch (error) {
    throw new CliError(describeApiError(error));
  }

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(
      bold(result.dryRun ? 'Move lists plan (dry run)' : 'Move lists') +
        dim(result.scope ? ` to scope ${result.scope}` : ' out of their scope')
    );
    console.log('');

    for (const warning of result.warnings) {
      console.log(`${yellow('warning')}: ${warning}`);
    }
    if (result.changes.length === 0 && result.warnings.length === 0) {
      console.log(dim('No lists to move'));
    }
    result.changes.forEach(printMoveChange);

    const { summary } = result;
    const parts = [
      `${summary.move} to move`,
      `${summary.assign} to assign`,
      `${summary.release} to release`,
      `${summary.noChange} unchanged`,
    ];
    if (summary.error > 0) {
      parts.push(red(`${summary.error} with errors`));
    }
    console.log(`\n${parts.join(', ')}`);
  }

  if (result.blockedBy) {
    throw new CliError(
      result.dryRun
        ? `A real move would be refused: ${result.blockedBy.message}`
        : result.blockedBy.message
    );
  }

  if (!values.json) {
    const { move, assign, release } = result.summary;

    if (move + assign + release === 0) {
      console.log(green('Nothing to change'));
    } else {
      console.log(
        result.applied ? green('Applied') : dim('Not applied (dry run)')
      );
    }
  }
}

// -----------------------------------------------------------------------------
// rebuild-index
// -----------------------------------------------------------------------------

async function rebuildIndex(positionals, values) {
  const [list, index] = positionals;

  if (!list || !index) {
    throw new CliError('Usage: jsonpad rebuild-index <list> <index>');
  }

  const jsonpad = createClient();
  let rebuilt;

  try {
    rebuilt = await jsonpad.rebuildIndex(list, index);
  } catch (error) {
    throw new CliError(describeApiError(error));
  }

  console.log(`Rebuilding index ${bold(`${list}/${index}`)}`);

  if (values.wait) {
    await waitForIndexes(
      jsonpad,
      [
        {
          listId: rebuilt.listId || list,
          indexId: rebuilt.id,
          label: `${list}/${index}`,
        },
      ],
      parseTimeout(values.timeout)
    );
  }
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

const COMMANDS = {
  'sync-schema': {
    run: syncSchema,
    options: {
      'dry-run': { type: 'boolean' },
      'allow-rebuild': { type: 'boolean' },
      prune: { type: 'boolean' },
      'allow-destructive': { type: 'boolean' },
      wait: { type: 'boolean' },
      timeout: { type: 'string' },
      'show-unchanged': { type: 'boolean' },
      json: { type: 'boolean' },
    },
  },
  'export-schema': {
    run: exportSchema,
    options: {
      scope: { type: 'string' },
      tagged: { type: 'string', multiple: true },
      lists: { type: 'string' },
      out: { type: 'string' },
    },
  },
  'move-lists': {
    run: moveLists,
    options: {
      to: { type: 'string' },
      release: { type: 'boolean' },
      'from-scope': { type: 'string' },
      'dry-run': { type: 'boolean' },
      json: { type: 'boolean' },
    },
  },
  'rebuild-index': {
    run: rebuildIndex,
    options: {
      wait: { type: 'boolean' },
      timeout: { type: 'string' },
    },
  },
};

async function main(argv) {
  const [commandName, ...rest] = argv;

  printDeprecationNotice();

  if (!commandName || ['-h', '--help', 'help'].includes(commandName)) {
    process.stdout.write(HELP);
    return EXIT_OK;
  }

  if (['-v', '--version'].includes(commandName)) {
    console.log(version);
    return EXIT_OK;
  }

  const command = COMMANDS[commandName];
  if (!command) {
    throw new CliError(
      `Unknown command "${commandName}". Run jsonpad --help for usage`
    );
  }

  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...command.options, help: { type: 'boolean', short: 'h' } },
      allowPositionals: true,
    });
  } catch (error) {
    throw new CliError(`${error.message}. Run jsonpad --help for usage`);
  }

  if (parsed.values.help) {
    process.stdout.write(HELP);
    return EXIT_OK;
  }

  await command.run(parsed.positionals, parsed.values);

  return EXIT_OK;
}

main(process.argv.slice(2)).then(
  exitCode => {
    process.exitCode = exitCode;
  },
  error => {
    console.error(
      red(error instanceof CliError ? error.message : `Error: ${error.stack}`)
    );
    process.exitCode = error instanceof CliError ? error.exitCode : EXIT_ERROR;
  }
);
