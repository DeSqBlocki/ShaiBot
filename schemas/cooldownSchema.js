const { default: mongoose } = require("mongoose");

const reqString = {
    type: String,
    required: true,
}

const reqInteger = {
    type: Number,
    required: true,
}

const cooldownSchema = new mongoose.Schema({
    _id: reqString,
    command: reqString,
    subcommand: reqString,
    cooldown: reqInteger
})

module.exports = mongoose.model('cooldowns', cooldownSchema)