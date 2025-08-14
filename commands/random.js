const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const uri = process.env.URI
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
const expansions = new Map([
    ["ARR", { "min": 0, "max": 50 }],
    ["HW", { "min": 51, "max": 60 }],
    ["SB", { "min": 61, "max": 70 }],
    ["ShB", { "min": 71, "max": 80 }],
    ["EW", { "min": 81, "max": 90 }],

])

async function getDutyData(interaction, database, user) {
    var parameters = {
        "type": interaction.options.getString('type'),
        "min": interaction.options.getInteger('minlevel'),
        "max": interaction.options.getInteger('maxlevel'),
        "expansion": interaction.options.getString('expansion')
    }
    if (!parameters.type) {
        //no type specified, randomizing...
        database.listCollections().toArray(function (err, results) {
            if (err) throw err;
            let random = Math.floor(Math.random() * results.length)
            parameters.type = results[random].name
        })
    }

    if (parameters.expansion) {
        //check if paramters are set correctly
        if (!parameters.min) {
            parameters.min = expansions.get(parameters.expansion).min
        }
        if (parameters.min < expansions.get(parameters.expansion).min) {
            return console.log("mismatch min level and expansion")
        }

        if (!parameters.max) {
            parameters.max = expansions.get(parameters.expansion).max
        }
        if (parameters.max > expansions.get(parameters.expansion).max) {
            return console.log("mismatch max level and expansion")
        }
    } else {
        if (!parameters.min) { parameters.min = 0 }
        if (!parameters.max) { parameters.max = 90 }
    }

    if (parameters.type == 'pvp') {
        parameters.expansion = 'ARR'
        parameters.min = expansions.get(parameters.expansion).min
        parameters.max = expansions.get(parameters.expansion).max
    }

    await delay(500) //wait for updates
    database.collection(parameters.type).find({
        level: { '$gte': parameters.min, '$lte': parameters.max }
    }).toArray(async function (err, results2) {
        let random = Math.floor(Math.random() * results2.length)
        try {
            let duty = results2[random]
            let reply = `<@${user.id}>, Thou shalt playeth...${duty.name} [Level: ${duty.level}, Type: ${parameters.type}`
            if (duty.expansion) {
                reply += `, Expansion: ${duty.expansion}]`
            } else {
                reply += ']'
            }

            interaction.reply({
                content: reply
            })
        } catch (error) {
            interaction.reply({
                content: `WAA!! (Impossible Combination found)`
            })
        }
    })
}
async function getClassData(interaction, database, user) {
    var collection = interaction.options.getString('type')
    if (!collection) {
        //no type specified
        database.listCollections().toArray(function (err, cResults) {
            let rdm = Math.floor(Math.random() * cResults.length)
            collection = cResults[rdm].name
        })
    }

    await delay(200) //wait for database.listCollections()

    database.collection(collection).find({}).toArray(async function (err, results) {
        if (err) throw err;
        var response
        try {
            let rdm = Math.floor(Math.random() * results.length)
            response = `<@${user.id}>, Thou shalt playeth...${results[rdm].job}`
        } catch (error) {
            response = 'Invalid Type specified!'
        }
        interaction.reply({
            content: response,
        })
    })
}
module.exports = {
    category: 'Random',
    description: 'randomized helper', // Required for slash commands
    slash: true, // Create both a slash and legacy command
    options: [
        {
            name: "duty",
            type: 1,
            description: "random duty",
            options: [
                {
                    name: 'type',
                    description: 'what kind of duty would you like?',
                    required: false,
                    type: 3,
                    choices: [
                        { "name": 'Dungeons', "value": "dungeons" },
                        { "name": 'Guildhests', "value": "guildhests" },
                        { "name": 'PvP', "value": "pvp" },
                        { "name": 'Normal Raids', "value": "nraids" },
                        { "name": 'Alliance Raids', "value": "araids" },
                        { "name": 'Trials', "value": "trials" },
                        { "name": 'Extreme', "value": "extreme" },
                        { "name": 'Savage', "value": "savage" },
                        { "name": 'Ultimates', "value": "ultimates" },
                        { "name": 'Roulettes', "value": "roulettes" },
                    ],
                },
                {
                    name: 'minlevel',
                    description: 'Start of Level Range, assuming 0 if not specified',
                    required: false,
                    type: 4,
                },
                {
                    name: 'maxlevel',
                    description: 'End of Level Range, assuming 90 if not specified',
                    required: false,
                    type: 4,
                },
                {
                    name: 'expansion',
                    description: 'which expansion would you like?',
                    required: false,
                    type: 3,
                    choices: [
                        { "name": 'A Realm Reborn', "value": "ARR" },
                        { "name": 'Heavensward', "value": "HW" },
                        { "name": 'Stormblood', "value": "SB" },
                        { "name": 'Shadowbringers', "value": "ShB" },
                        { "name": 'Endwalker', "value": "EW" },
                    ],
                }
            ],
        },
        {
            name: "class",
            type: 1,
            description: "random class",
            options: [
                {
                    name: 'type',
                    description: 'specify class',
                    required: false,
                    type: 3,
                    choices: [
                        { "name": 'Healer', "value": "healer" },
                        { "name": 'Tank', "value": "tank" },
                        { "name": 'Melee', "value": "melee" },
                        { "name": 'Ranged', "value": "ranged" },
                        { "name": 'Caster', "value": "caster" },
                    ],
                }
            ]
        }

    ],
    callback: ({ interaction, user }) => {
        switch (interaction.options._subcommand) {
            case "duty":
                client.connect(function (err, db) {
                    if (err) throw err;

                    var dbDuties = db.db("Duties")
                    getDutyData(interaction, dbDuties, user)
                })
                break;
            case "class":
                client.connect(async function (err, db) {
                    if (err) throw err;

                    var dbClasses = db.db("Classes")
                    getClassData(interaction, dbClasses, user)
                })
            default:
                break;
        }
    },
}