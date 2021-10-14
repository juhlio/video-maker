const robots = {

    input: require('./robots/input.js'),
    wikipedia: require('./robots/wikipedia.js'),
    text: require('./robots/text.js'),
    state: require('./robots/state.js'),
    image: require('./robots/image.js'),

}

async function start() {

    robots.input()
    const content = robots.state.load()
    content.wikiPediaContent = await robots.wikipedia(content)
    robots.state.save(content)
    await robots.text()
    await robots.image()

    //const content2 = robots.state.load()
    //console.dir(content2, { depth: null })

}

start()