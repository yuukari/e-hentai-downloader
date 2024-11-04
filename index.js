import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir } from 'fs/promises';

import { ArgumentParser } from 'argparse';
import sanitize from 'sanitize-filename';
import { ProgressBar } from '@opentf/cli-pbar';

import * as io from './src/io.js';
import * as validators from './src/validators.js';

import galleryParser from './src/parser/galleryParser.js';
import workerManager from './src/worker/workerManager.js';
import stopwatch from './src/utils/stopwatch.js';

import ValidationError from './src/error/validationError.js';

const gp = galleryParser();
const downloadProgress = new ProgressBar();

const init = async () => {
    const parser = new ArgumentParser({
        description: 'e-hentai-downloader v0.1.1'
    });
    parser.add_argument('-l', '--link', {
        help: 'Link to the gallery',
        required: true
    });
    parser.add_argument('-w', '--workers', {
        help: 'Workers count, default is 5',
        required: false,
        default: 5
    });
    parser.add_argument('-wr', '--worker-retries', {
        help: 'Worker download retries count, default is 3',
        required: false,
        default: 3
    });
    parser.add_argument('-o', '--out', {
        help: 'Output directory, default is "./galleries"',
        required: false,
        default: "./galleries"
    });
    parser.add_argument('-ft', '--filename-template', {
        help:
            'Filename template, default is "*f*e", available variables: ' +
            ' *f - original file name;' +
            ' *e - original file extension;' +
            ' *c - counter, may be set through "-c" argument',
        required: false,
        default: '*f*e'
    });
    parser.add_argument('-c', '--counter', {
        help: 'Start file counter value, may be used in filename templates through "-ft" argument',
        required: false,
        default: 0
    });

    const args = parser.parse_args();

    try {
        await prepare(args);
        await download(args);
    } catch (e) {
        if (['ValidationError', 'CommonError'].includes(e.name)) {
            io.warning(e.message);
            return;
        }

        throw e;
    }
};

const prepare = async (args) => {
    io.heart(`Preparing to download gallery from ${args.link}`);

    if (!validators.isLinkValid(args.link)) {
        throw new ValidationError(`"${args.link}" is a not a valid link to gallery`);
    }

    await gp.init(args.link);
    const galleryInfo = gp.getInfo();
    io.info(
        `Gallery found!` +
        `\n    Title: ${galleryInfo.title}` +
        `\n    Type: ${galleryInfo.type}` +
        `\n    Rating: ${galleryInfo.rating}` +
        `\n    Total pages count: ${galleryInfo.pagesCount}`
    );

    io.info(`Parsing pages...`);
    stopwatch.start();
    await gp.loadPagesData();
    stopwatch.stop();
    io.info(`Parsing done in ${stopwatch.getFormattedResult()}`);
};

const download = async (args) => {
    const outputDirectory = path.join(args.out, sanitize(gp.getInfo().title));
    if (!existsSync(outputDirectory)) {
        io.info(`Creating new directory on path "${outputDirectory}"`);
        await mkdir(outputDirectory, { recursive: true });
    }

    workerManager.init({
        pagesData: gp.getPagesData(),
        poolSize: args.workers,
        retriesCount: args.worker_retries,
        outputDirectory,
        filenameTemplate: args.filename_template,
        initialCounter: args.counter,

        onWorkerDone: handleDownloadProgressUpdate,
        onWorkerFailed: handleDownloadProgressUpdate
    });

    downloadProgress.start({
        prefix: '⏳  Downloading',
        total: gp.getInfo().pagesCount,
        showCount: true
    });

    stopwatch.start();
    await workerManager.run();
    stopwatch.stop();

    const failedWorkers = workerManager.getFailedWorkersCount();

    if (failedWorkers > 0) {
        downloadProgress.update({
            prefix: '⚠️  Partially done',
            value: gp.getInfo().pagesCount,
            suffix: "\n"
        });
        io.warning(`Download finished in ${stopwatch.getFormattedResult()}. Gallery partially saved in "${outputDirectory}"`);
        io.warning(`Failed workers count: ${failedWorkers}/${gp.getInfo().pagesCount}`);
        return;
    }

    downloadProgress.update({
        prefix: '✅  Done',
        value: gp.getInfo().pagesCount,
        suffix: "\n"
    });
    io.heart(`Download finished in ${stopwatch.getFormattedResult()}. Gallery saved in "${outputDirectory}"`);
};

const handleDownloadProgressUpdate = () => {
    downloadProgress.update({ value: workerManager.getProcessedWorkersCount() });
}

init()
    .catch((e) => {
        io.error(`Something went wrong (><)`, e);
    });