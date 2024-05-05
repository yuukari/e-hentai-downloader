import * as path from 'node:path';

const filenameCreator = () => {
    const create = (template, params) => {
        const ext = path.extname(params.filename);
        const name = path.basename(params.filename).replace(ext, '');

        return template
            .replaceAll('*f', name)
            .replaceAll('*e', ext)
            .replaceAll('*c', params.counter);
    }

    return {
        create
    }
}

export default filenameCreator();