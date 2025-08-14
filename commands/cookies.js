// cookies.js — rewritten & rebalanced
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const cookieSchema = require("../schemas/cookieSchema");      // expected to support findOne, findOneAndUpdate, updateOne, find
const cooldownSchema = require("../schemas/cooldownSchema");  // expected to support findOne, findOneAndUpdate
const Discord = require('discord.js');

const URI = process.env.URI;
if (!URI) throw new Error("Missing process.env.URI for MongoDB");

// single client reused
const client = new MongoClient(URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1
});
client.connect().catch(err => {
    console.error("Mongo connect error:", err);
});

// util
const msToTime = (duration) => {
    const ms = Math.floor((duration % 1000) / 100);
    const s = Math.floor((duration / 1000) % 60);
    const m = Math.floor((duration / (1000 * 60)) % 60);
    const h = Math.floor((duration / (1000 * 60 * 60)) % 24);
    const pad = n => (n < 10 ? "0" + n : "" + n);
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const delay = ms => new Promise(r => setTimeout(r, ms));

// --- Helpers ---
async function getCookies(userId) {
    const rec = await cookieSchema.findOne({ _id: userId });
    return rec && typeof rec.cookies === 'number' ? rec.cookies : 0;
}

async function changeCookies(userId, delta, username = null) {
    // upsert and set username if provided
    const update = { $inc: { cookies: delta } };
    if (username) update.$set = { user: username };
    return cookieSchema.findOneAndUpdate(
        { _id: userId },
        update,
        { upsert: true, returnDocument: 'after' }
    );
}

async function getCooldown(uniqueId) {
    const rec = await cooldownSchema.findOne({ _id: uniqueId });
    return rec && rec.cooldown ? rec.cooldown : 0;
}

async function setCooldown(uniqueId, command, subcommand, msTimestamp) {
    await cooldownSchema.findOneAndUpdate(
        { _id: uniqueId },
        { _id: uniqueId, command, subcommand, cooldown: msTimestamp },
        { upsert: true }
    );
}

function cooldownId(guildId, userId, command, subcommand) {
    return `${guildId}-${userId}-${command}-${subcommand}`;
}

// --- Game logic & rebalances ---
// Notes about balancing:
// - Collect: 1..20 cookies (consistent reward); Abra (special user id) gets 1.5x.
// - Steal:
//    * successChance = attacker / (attacker + defender), clamped to [0.10, 0.90]
//    * steal amount: random 1..ceil(defender/4)
//    * failure penalty: attacker loses random 1..ceil(attacker/6) (transferred to defender)
// - Cooldowns: collect = 1 hour, steal = 15 minutes

const ABRA_ID = "378135175059603457"; // kept from original for bonus

async function collect(interaction, user) {
    const sub = interaction.options._subcommand;
    const id = cooldownId(interaction.guildId, interaction.user.id, interaction.commandName, sub);
    const now = Date.now();
    const existing = await getCooldown(id);
    if (existing > now) {
        return interaction.reply({
            content: `The batch is still cooking, come back in **${msToTime(existing - now)}**`,
            ephemeral: true
        });
    }

    // set cooldown (1 hour)
    const cooldownUntil = now + 60 * 60 * 1000;
    await setCooldown(id, interaction.commandName, sub, cooldownUntil);

    // balanced collect amount: 1..20
    let amount = Math.floor(Math.random() * 20) + 1;
    if (user.id === ABRA_ID) amount = Math.ceil(amount * 1.5);

    // update DB
    await changeCookies(user.id, amount, user.username);

    // playful responses (kept / adapted)
    const collectResponses = (amount, user) => {
        const s = amount === 1 ? 'Cookie' : 'Cookies';
        return [
            `${user}, I made you **${amount}** ${s} 🍪`,
            `${user}, here's your **${amount}** ${s} 🍪 I ate the rest, sorry >.<`,
            `Only **${amount}** ${s} 🍪 for you today ${user}... Abra stole the rest :c`,
            `${user}, would you like a Glass of Milk with your **${amount}** ${s}? 🍪`,
            `**${amount}** ${s} 🍪 Careful, ${user}! They're still warm :3`,
            `**${amount}** ${s} 🍪 Best Batch yet!`,
            `**${amount}** ${s} 🍪 These, I bequeath unto thine own self upon this day. Thou must guard them safely.`,
            `${user}, your **${amount}** ${s} 🍪 are fresh out of the oven... try not to burn your tongue!`,
            `${user}, I bribed the Cookie Monster to spare these **${amount}** ${s} 🍪 just for you.`,
            `${user}, Santa came early! You got **${amount}** ${s} 🍪 (milk not included).`,
            `${user}, your **${amount}** ${s} 🍪 are artisanal, gluten-free, and slightly cursed.`,
            `A wild baker appeared! They hand you **${amount}** ${s} 🍪`,
            `${user}, Abra said these **${amount}** ${s} 🍪 are "totally not stolen"... 🤔`,
            `${user}, here’s your **${amount}** ${s} 🍪 — watch out, they may be booby-trapped.`
        ];
    };


    const responses = collectResponses(amount, user);
    const i = Math.floor(Math.random() * responses.length);
    return interaction.reply({ content: responses[i] });

}

async function steal(interaction, user) {
    const target = interaction.options.getUser('target');
    if (!target) {
        return interaction.reply({ content: `Pick someone to steal from.`, ephemeral: true });
    }
    if (target.id === user.id) {
        return interaction.reply({
            content: `C'mon, don't embarrass yourself! We all know you couldn't do that, even if you tried.`,
            ephemeral: true
        });
    }

    // pull balances
    const your = await getCookies(user.id);
    const their = await getCookies(target.id);

    if (your <= 0) {
        return interaction.reply({ content: `You need at least 1 Cookie to attempt a Robbery`, ephemeral: true });
    }
    if (their <= 0) {
        return interaction.reply({ content: `Shame on you! ${target.username} doesn't have any Cookies D:`, ephemeral: true });
    }

    // steal cooldown (15 minutes)
    const sub = interaction.options._subcommand;
    const id = cooldownId(interaction.guildId, interaction.user.id, interaction.commandName, sub);
    const now = Date.now();
    const existing = await getCooldown(id);
    const chaos = true // 50% Stela Chance Mode

    if (existing > now) {
        return interaction.reply({
            content: `Hold up — try stealing again in **${msToTime(existing - now)}**`,
            ephemeral: true
        });
    }
    await setCooldown(id, interaction.commandName, sub, now + 15 * 60 * 1000);

    // success chance and clamping
    let successChance = your / (your + their);
    if (isNaN(successChance) || !isFinite(successChance)) successChance = 0.2;
    if (chaos) {
	successChance = 0.5
    } else {
    	successChance = Math.max(0.10, Math.min(0.90, successChance));
    }
    const success = Math.random() < successChance;

    if (success) {
        const stealSuccessResponses = (amount, target) => {
            const s = amount === 1 ? 'Cookie' : 'Cookies';
            return [
                `You've successfully stolen **${amount}** ${s} from **${target.username}**!`,
                `Ninja mode: activated. You snatched **${amount}** ${s} from **${target.username}** without a crumb left behind.`,
                `Abra taught you well — **${amount}** ${s} from **${target.username}** are now yours!`,
                `Like a phantom in the night, you took **${amount}** ${s} from **${target.username}**.`,
                `You just pulled the sweetest heist: **${amount}** ${s} from **${target.username}**!`,
                `Mission complete. **${target.username}** is **${amount}** ${s} poorer, you are richer.`,
                `You distracted **${target.username}** with a dance and swiped **${amount}** ${s}.`,
                `Clean getaway! **${target.username}** won’t know about the missing **${amount}** ${s} until it’s too late.`,
                `The Cookie Vault has been breached. **${amount}** ${s} taken from **${target.username}**.`,
                `You emerged from the shadows with **${amount}** ${s} from **${target.username}**.`
            ];
        };

        const maxSteal = Math.max(1, Math.ceil(their / 4)); // steal up to ~25% of victim
        let amount = Math.floor(Math.random() * maxSteal) + 1;
        amount = Math.min(amount, their);

        // transfer
        await Promise.all([
            changeCookies(user.id, amount, user.username),
            changeCookies(target.id, -amount, target.username)
        ]);

        const responses = stealSuccessResponses(amount, target);
        const i = Math.floor(Math.random() * responses.length);
        return interaction.reply({ content: `${responses[i]} (Chance: ${Math.round(successChance * 100, 2)}%)` });

    } else {
        const stealFailResponses = (penalty, target) => {
            const s = penalty === 1 ? 'Cookie' : 'Cookies';
            return [
                `You were caught red-handed by **${target.username}** and lost **${penalty}** ${s} as a penalty!`,
                `Fail! **${target.username}** caught you mid-bite — you dropped **${penalty}** ${s}.`,
                `Not your best moment... You lost **${penalty}** ${s} to **${target.username}** in the struggle.`,
                `Stealth level: 0. You handed **${penalty}** ${s} to **${target.username}** as an apology.`,
                `The cookie jar was booby-trapped! You gave **${penalty}** ${s} to **${target.username}** while running away.`,
                `Ouch. The guard dog barked, and now **${target.username}** has your **${penalty}** ${s}.`,
                `You tripped over your own shoelace — **${target.username}** reclaimed **${penalty}** ${s}.`,
                `Caught by the Cookie Police! **${penalty}** ${s} confiscated and given to **${target.username}**.`,
                `Your pockets had holes... **${target.username}** picked up **${penalty}** ${s} you dropped.`
            ];
        };


        // failure penalty: attacker loses a little (1..ceil(your/6)) to the victim
        const maxPenalty = Math.max(1, Math.ceil(your / 6));
        const penalty = Math.min(your, Math.floor(Math.random() * maxPenalty) + 1);

        await Promise.all([
            changeCookies(user.id, -penalty, user.username),
            changeCookies(target.id, +penalty, target.username)
        ]);

        const responses = stealFailResponses(penalty, target);
        const i = Math.floor(Math.random() * responses.length);
        return interaction.reply({ content: `${responses[i]} (Chance: ${Math.round(successChance * 100, 2)}%)` });

    }
}

async function check(interaction, user) {
    let target = interaction.options.getUser('target');
    if (!target) target = user;

    const cookies = await getCookies(target.id);
    const mood = cookies === 0 ? '😔' : '😲';
    return interaction.reply({ content: `**${target.username}** has **${cookies}** Cookies! ${mood}` });
}

async function give(interaction, user) {
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');

    if (!target) return interaction.reply({ content: `You need to specify a target.`, ephemeral: true });
    if (target.id === user.id) return interaction.reply({ content: 'You cannot give yourself Cookies ._."', ephemeral: true });
    if (!Number.isInteger(amount) || amount < 1) {
        return interaction.reply({ content: `**${user}** shared *checks notes* **${amount}** Cookie(s) with ${target}....wait a minute!!`, ephemeral: true });
    }

    const your = await getCookies(user.id);
    if (your < amount) return interaction.reply({ content: `We don't run a charity here, get more Cookies!`, ephemeral: true });

    await Promise.all([
        changeCookies(user.id, -amount, user.username),
        changeCookies(target.id, +amount, target.username)
    ]);

    // small delay to mimic previous behavior
    await delay(200);
    return interaction.reply({ content: `**${user}** shared **${amount}** Cookie(s) with ${target}` });
}

async function leader(interaction) {
    const results = await cookieSchema.find().sort({ cookies: -1 }).limit(10);
    let cookieSorted = '';
    results.forEach((r, i) => {
        cookieSorted += `[${i + 1}] <@${r._id}> (${r.cookies})\n`;
    });

    const embed = new Discord.MessageEmbed()
        .setColor(0x0099FF)
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp()
        .addFields({ name: `-Cookie Leaderboard-`, value: cookieSorted || 'No cookie data yet.' });

    return interaction.reply({ embeds: [embed] });
}

module.exports = {
    slash: true,
    description: 'collect a cookie',
    category: 'Misc',
    options: [
        { name: "collect", description: "want some?", type: 1 },
        { name: "steal", description: "try your luck at a lala robbery!", type: 1, options: [{ name: "target", description: "someone", required: true, type: 6 }] },
        { name: "check", description: "check your cookie stash", type: 1, options: [{ name: "target", description: "someone", type: 6 }] },
        { name: "give", description: "share your cookies with someone", type: 1, options: [{ name: "target", description: "someone", required: true, type: 6 }, { name: "amount", description: "cookies", required: true, type: 4 }] },
        { name: "leader", description: "show Top 10 Cookie Clickers", type: 1 }
    ],
    callback: ({ interaction, user }) => {
        const sub = interaction.options._subcommand;
        switch (sub) {
            case "collect": return collect(interaction, user);
            case "steal": return steal(interaction, user);
            case "check": return check(interaction, user);
            case "give": return give(interaction, user);
            case "leader": return leader(interaction);
            default: return interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
        }
    }
};