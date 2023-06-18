const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    difficultyLevel: {
        type: String,
        required: false
    },
    rating: {
        type: Number
    },
    tags: {
        type: [String],
        required: true
    },
    source: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;