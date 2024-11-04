import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

import CommonError from '../error/commonError.js';

const galleryParser = () => {
    let _link = undefined;

    let _info = {
        title: undefined,
        type: undefined,
        rating: undefined,
        size: undefined,
        pagesCount: undefined
    };

    let _pagesData = [];

    const init = async (link) => {
        _link = link;
        const galleryPageHtml = await _sendRequest(_link);

        if (
            !galleryPageHtml.includes('class="gm"') ||
            !galleryPageHtml.includes('id="gleft"') ||
            !galleryPageHtml.includes('id="gmid"')
        ) {
            throw new CommonError(`Failed to find gallery on this link. You sure the link is correct?`);
        }

        const $ = cheerio.load(galleryPageHtml);

        _info.title = $('#gn').text();
        _info.type = $('#gdc .cs.ct6').text();
        _info.rating = $('#rating_label').text().split(': ')[1];
        _info.pagesCount = parseInt($('#gdd tr:nth-child(6) .gdt2').text().replace(/\D/g, ''));
    };

    const loadPagesData = async () => {
        let currentPage = 0;
        let isLastPage = false;

        while (!isLastPage) {
            const html = await _sendRequest(_getPaginatedUrl(currentPage));
            const $ = cheerio.load(html);

            const pageElements = $('#gdt a');
            for (const el of pageElements) {
                _pagesData.push({
                    pageLink: el.attribs['href']
                });
            }

            currentPage++;

            const nextArrow = $('.ptb td:last-child')[0];
            isLastPage = nextArrow.attribs['onclick'] === undefined;
        }
    }

    const getInfo = () => _info;

    const getPagesData = () => _pagesData;

    const _sendRequest = async (url) => {
        const response = await fetch(url);

        if (response.status === 200) {
            return await response.text();
        }

        if (response.status === 404) {
            throw new CommonError(`Gallery on "${url}" not found (got response with code 404)`);
        }

        throw new Error(`Failed to load data from "${url}": got response with code ${response.status}`);
    };

    const _getPaginatedUrl = (page) => {
        if (page === 0) {
            return _link;
        }

        return `${_link}?p=${page}`;
    }

    return {
        init,
        loadPagesData,

        getInfo,
        getPagesData
    };
};

export default galleryParser;