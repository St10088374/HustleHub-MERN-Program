const mongoose = require('mongoose');

const GigSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Gig title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Gig description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Web Development',
        'Mobile Development',
        'Graphic Design',
        'Content Writing',
        'Digital Marketing',
        'Data Analysis',
        'Video Editing',
        'Other',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least R1'],
      max: [100000, 'Price cannot exceed R100,000'],
    },
    deliveryDays: {
      type: Number,
      required: [true, 'Delivery time is required'],
      min: [1, 'Delivery must be at least 1 day'],
      max: [365, 'Delivery cannot exceed 365 days'],
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
GigSchema.index({ freelancer: 1 });
GigSchema.index({ category: 1 });
GigSchema.index({ isActive: 1 });

module.exports = mongoose.model('Gig', GigSchema);
