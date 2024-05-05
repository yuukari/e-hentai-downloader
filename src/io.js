const heart = (message) => {
    console.log(`❤️ ${message}`);
}

const info = (message) => {
    console.log(`◻️ ${message}`);
}

const warning = (message) => {
    console.warn(`⚠️ ${message}`)
}

const error = (message, e = undefined) => {
    console.error(`❌  ${message}${e !== undefined ? ` ↴` : ``}`);

    if (e !== undefined) {
        console.trace(e.stack);
    }
}

export {
    heart,
    info,
    warning,
    error
}