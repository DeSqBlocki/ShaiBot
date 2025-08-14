const { default: mongoose } = require("mongoose");

const reqString = {
    type: String,
    required: true,
}

const reqInteger = {
    type: Number,
    required: true,
}

const classSchema = new mongoose.Schema({
    _id: reqInteger,
    job: reqString
})

module.exports = mongoose.model('classes', classSchema)