import * as fs from 'node:fs';
import path from 'node:path';

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import filenameCreator from './../utils/filenameCreator.js';

import WorkerError from '../error/workerError.js';

const downloadWorker = ({ id, pageLink, retriesCount, outputDirectory, filenameTemplate, counter }) => {
    let _parseImageLinkFails = 0;
    let _downloadImageFails = 0;

    const run = async () => {
        let imageLink = null;
        let fileResponse = null;

        while (imageLink === null) {
            try {
                const imagePageHtml = await _sendRequest(pageLink);
                const $ = cheerio.load(await imagePageHtml.text());
                imageLink = $('#img')[0].attribs['src'];
            } catch (e) {
                _parseImageLinkFails++;
                if (_parseImageLinkFails >= retriesCount) {
                    throw new WorkerError(e, id);
                }
            }
        }

        while (true) {
            try {
                fileResponse = await _sendRequest(imageLink);
                await _download(fileResponse);

                return id;
            } catch (e) {
                _downloadImageFails++;
                if (_downloadImageFails >= retriesCount) {
                    throw new WorkerError(e, id);
                }
            }
        }
    };

    const _sendRequest = async (url) => {
        const response = await fetch(url);

        if (response.status !== 200) {
            throw new Error(`Failed to load data from "${url}": got response with code ${response.status}`);
        }

        return response;
    };

    const _download = (response) => new Promise((resolve, reject) => {
        const filename = path.basename(response.url);
        const filepath = path.join(outputDirectory, filenameCreator.create(filenameTemplate, {
            filename,
            counter
        }));

        const fileStream = fs.createWriteStream(filepath);

        response.body.pipe(fileStream);
        response.body.on('error', (e) => reject(e));

        fileStream.on('finish', () => {
            resolve();
        });
    });

    return {
        run
    };
};

export default downloadWorker;