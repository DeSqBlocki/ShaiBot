const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const uri = process.env.URI
const cookieSchema = require("../schemas/cookieSchema")
const cooldownSchema = require("../schemas/cooldownSchema")
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const Discord = require('discord.js')
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
function msToTime(duration) {
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}
async function collect(interaction, user) {
    client.connect(async (err, db) => {
        var dbo = db.db('test')
        let id = `${interaction.guildId}-${interaction.user.id}-${interaction.commandName}-${interaction.options._subcommand}`
        dbo.collection('cooldowns').findOne({
            _id: id
        }, async function (err, results) {
            let now = Date.now()
            let time = now + 3600000 // plus one hour in ms
            if (results) {
                if (results.cooldown > now) {
                    time = new Date(results.cooldown).toUTCString()
                    return interaction.reply({
                        content: `The batch is still cooking, come back in **${msToTime(results.cooldown - now)}**`,
                        ephemeral: true
                    })
                }
            }
            addCooldown(interaction.user.id, interaction.guildId, interaction.commandName, interaction.options._subcommand, time)

            
            var amount = Math.floor(Math.random() * 30)
            //random amount between 1 and 29
            if (user.id == "378135175059603457") {
                //Abra Bonus
                amount = Math.ceil(amount * 1.5)
            }

            var responses = [
                `${user}, I made you **${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? `,
                `${user}, Here's your **${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? I ate the rest, sorry >.<`,
                `Only **${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? for you today ${user}... Abra stole the rest :c`,
                `${user}, would you like a Glass of Milk with your **${amount}** ${amount == 1?`Cookie`: `Cookies`}? ???? `,
                `**${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? Careful, ${user}! They're still warm :3`,
                `**${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? Best Batch yet!`,
                `**${amount}** ${amount == 1?`Cookie`: `Cookies`} ???? These, I bequeath unto thine own self upon this day. Thou must guard them safely.`,
            ]
  
            await cookieSchema.findOneAndUpdate({
                _id: user.id
            }, {
                _id: user.id,
                user: user.username,
                $inc: { cookies: +amount }
            }, {
                upsert: true
            })

            if(amount === 0){
                interaction.reply({
                    content: `${user}, someone ate all your Cookies already D:`
                })
            } else {
                var i = Math.floor(Math.random() * responses.length)
                interaction.reply({
                    content: responses[i]
                })
            }
            // choose response
        })
    })
}
function steal(interaction, user) {
    client.connect(async (err, db) => {
        if (err) throw err;
        let target = interaction.options.getUser('target')
        let dbo = db.db("test")

        if (target.id == user.id) {
            return interaction.reply({
                content: `C'mon, don't embarass yourself! We all know you couldn't do that, even if you tried.`,
                ephemeral: true,
            })
        }

        // get your amount of cookies
        let your = await dbo.collection('cookies').findOne({
            _id: user.id
        })
        // get their amount of cookies
        let their = await dbo.collection('cookies').findOne({
            _id: target.id
        })
        try {
            if (!your.cookies) {
                return interaction.reply({
                    content: `You need at least 1 Cookie to attempt a Robbery`,
                    ephemeral: true,
                })
            }
            if (!their.cookies) {
                return interaction.reply({
                    content: `Shame on you! They don't even have any Cookies D:`,
                    ephemeral: true,
                })
            }
        } catch (error) {
            return interaction.reply({
                content: `How awkward...I don't know some of you!`,
                ephemeral: true,
            })
        }
        let difficulty = []
        for (var i = 0; i < their.cookies; i++) {
            if (i < your.cookies) {
                difficulty.push(true)
            } else {
                difficulty.push(false)
            }
        }
        let result = Math.floor(Math.random() * their.cookies) + 1
        let response
        if (!difficulty[result]) {
            // author lost
            response = `You were unsuccessful at robbing **${target.username}** and lost your chance at **${result}** ${result == 1?`Cookie`: `Cookies`}! `
            if (your.cookies - result <= 0) {
                result = your.cookies
                response += `That's all your Cookies gone.`
            }
            result *= -1

        } else {
            //author won
            response = `You've successfully stolen **${result<their.cookies?result:their.cookies}** ${result == 1?`Cookie`: `Cookies`} from **${target.username}**! `
            if (their.cookies - result <= 0) {
                result = their.cookies
                response += `They're completely dry now.`
            }
        }
        interaction.reply({
            content: response
        })

        //update author's cookies
        await cookieSchema.findOneAndUpdate({
            _id: user.id
        }, {
            _id: user.id,
            user: user.username,
            $inc: { cookies: +result } //will decrease if it's +negativeInteger
        }, {
            upsert: true
        })

        await cookieSchema.findOneAndUpdate({
            _id: target.id
        }, {
            _id: target.id,
            user: target.username,
            $inc: { cookies: -result } //will decrease if it's +negativeInteger
        }, {
            upsert: true
        })
    })



}
function check(interaction, user) {

    client.connect(async function (err, db) {
        let target = interaction.options.getUser('target')

        if (!target) {
            target = user
        }
        let response = `**${target.username}** has `
        let dbo = db.db("test")
        dbo.collection("cookies").findOne({
            _id: target.id
        }, function (err, results) {
            let cookies
            if (!results) {
                cookies = 0
                response += `**${cookies}** Cookies! ????`
            } else {
                cookies = results.cookies
                response += `**${cookies}** Cookies! ????`
            }
            interaction.reply({
                content: response
            })
        })
    })
}
async function give(interaction, user) {
    client.connect(async function (err, db) {
        let target = interaction.options.getUser('target')
        let amount = interaction.options.getInteger('amount')
        let dbo = db.db('test')

        //check if you have enough cookies
        let your = await dbo.collection('cookies').findOne({
            _id: user.id
        })

        if (target.id == user.id) {
            return interaction.reply({
                content: 'You cannot give yourself Cookies ._."'
            })
        }
        if (your.cookies < amount) {
            return interaction.reply({
                content: `We don't run a charity here, get more Cookies!`
            })
        }
        if (amount < 1) {
            return interaction.reply({
                content: `**${user}** shared *checks notes* **${amount}** Cookie(s) with ${target}....wait a minute!!`,
            })
        }

        //update user's cookies
        await cookieSchema.findOneAndUpdate({
            _id: user.id
        }, {
            _id: user.id,
            user: user.username,
            $inc: { cookies: -amount }
        }, {
            upsert: true
        })

        //update target's cookies
        await cookieSchema.findOneAndUpdate({
            _id: target.id
        }, {
            _id: target.id,
            user: target.username,
            $inc: { cookies: +amount }
        }, {
            upsert: true
        })
        await delay(200)
        interaction.reply({
            content: `**${user}** shared **${amount}** Cookie(s) with ${target}`
        })

    })
}
async function addCooldown(userId, guildId, command, subcommand, ms) {
    let id = `${guildId}-${userId}-${command}-${subcommand}`
    await cooldownSchema.findOneAndUpdate({
        _id: id
    }, {
        _id: id,
        command: command,
        subcommand: subcommand,
        cooldown: ms
    }, {
        upsert: true
    })
}
async function leader(interaction) {
    const results = await cookieSchema.find().sort({
        cookies: -1
    }).limit(10)
    let cookieSorted = ''
    let i = 0
    results.forEach((result) => {
        cookieSorted += `[${i + 1}] <@${result._id}> (${result.cookies})\n`
        i++;
    })

    var embed = new Discord.MessageEmbed()
        .setColor(0x0099FF)
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp()
        .addFields({ name: `-Cookie Leaderboard-`, value: cookieSorted })

    interaction.reply({
        embeds: [embed]
    })
}
module.exports = {
    slash: true,
    description: 'collect a cookie',
    category: 'Misc',
    options: [
        //collect
        {
            name: "collect",
            description: "want some?",
            type: 1 // SubCommand Type
        },
        //steal
        {
            name: "steal",
            description: "try your luck at a lala robbery!",
            type: 1, // SubCommand Type
            options: [
                {
                    name: "target",
                    description: "someone",
                    required: true,
                    type: 6 // User Type
                }
            ]
        },
        //check
        {
            name: "check",
            description: "check your cookie stash",
            required: false,
            type: 1, // SubCommand Type
            options: [
                {
                    name: "target",
                    description: "someone",
                    type: 6 // User Type
                }
            ]
        },
        //give
        {
            name: "give",
            description: "share your cookies with someone",
            required: false,
            type: 1, // SubCommand Type
            options: [
                {
                    name: "target",
                    description: "someone",
                    required: true,
                    type: 6 // User Type
                }, {
                    name: "amount",
                    description: "cookies",
                    required: true,
                    type: 4 // Integer Type
                }
            ]
        },
        //leader
        {
            name: "leader",
            description: "show Top 10 Cookie Clickers",
            type: 1, // SubCommand Type
        },
    ],
    callback: ({ interaction, user }) => {
        switch (interaction.options._subcommand) {
            case "collect":
                collect(interaction, user)
                break;
            case "steal":
                steal(interaction, user)
                break;
            case "check":
                check(interaction, user)
                break;
            case "give":
                give(interaction, user)
                break;
            case "leader":
                leader(interaction)
                break;
            default:
                break;
        }
    }
}
