const mongoose = require('mongoose')

const reqString = {
    type: String,
    required: true,
}
const reqInteger = {
    type: Number,
    required: true,
}

const cookieSchema = new mongoose.Schema({
    //Guild ID
    _id: reqString,
    user: reqString,
    cookies: reqInteger
})

module.exports = mongoose.model('Cookies', cookieSchema)