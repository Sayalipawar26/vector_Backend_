// controllers/videoController.js

// Existing imports and configurations

const Video = require('../models/video');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// Ensure directory existence
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  fs.mkdirSync(dirname, { recursive: true });
};

// Multer storage configuration for videos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads'); // Adjust path as needed
    ensureDirectoryExistence(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Keep the original file name
  }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG files are allowed.'), false);
  }
};

// Multer upload configuration
const upload = multer({ storage, fileFilter }).single('thumbnail');

// Controller methods
const videoController = {
  // Create a new video
  async createVideo(req, res) {
    upload(req, res, async (err) => {
      if (err) {
        console.error('Error uploading thumbnail image:', err);
        return res.status(400).json({ error: 'Error uploading thumbnail image', details: err.message });
      }

      try {
        const { title, description, link } = req.body;
        const thumbnailPath = req.file ? `uploads/${req.file.filename}` : '';

        const newVideo = new Video({
          title,
          description,
          thumbnail: thumbnailPath,
          link
        });

        await newVideo.save();

        // Construct HTTP URLs for frontend consumption
        const baseUrl = `${req.protocol}://${req.get('host')}/app1`;
        const thumbnailURL = `${baseUrl}/${thumbnailPath}`;

        // Modify the video object to include HTTP URLs
        newVideo.thumbnail = thumbnailURL;

        res.status(201).json({ message: 'Video created successfully', video: newVideo });
      } catch (error) {
        console.error('Error saving video:', error);
        res.status(500).json({ error: 'Error saving video', details: error.message });
      }
    });
  },

  // Get all videos
  async getAllVideos(req, res) {
    try {
      const videos = await Video.find();
      const baseUrl = `${req.protocol}://${req.get('host')}/app1`;
      res.status(200).json(videos.map(video => ({
        ...video.toObject(),
        thumbnail: `${baseUrl}/${video.thumbnail}`
      })));
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Error fetching videos', details: error.message });
    }
  },

  // Remove a video by ID
  async removeVideo(req, res) {
    try {
      const { id } = req.params;

      // Check if the provided id is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
      }

      const video = await Video.findByIdAndDelete(id);

      if (!video) {
        return res.status(404).json({ message: 'Video not found' });
      }

      // Delete the thumbnail file from the server
      const thumbnailPath = path.join(__dirname, '..', video.thumbnail);
      if (video.thumbnail && fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }

      res.json({ message: 'Video deleted successfully', video });
    } catch (error) {
      console.error('Error deleting video:', error);
      res.status(500).json({ error: 'Error deleting video', details: error.message });
    }
  }
};

module.exports = videoController;
