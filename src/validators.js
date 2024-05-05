const isLinkValid = (link) => {
    if (link.indexOf('http://') !== 0 && link.indexOf('https://') !== 0) {
        return false;
    }

    return link.indexOf('e-hentai.org/g/') !== -1;
}

export {
    isLinkValid
}