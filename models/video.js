// models/Video.js
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
