const generateMessage = (text, username) => {
    return {
        text,
        createdAt: new Date().getTime(),
        username: username
    }
}

module.exports = {
    generateMessage
}