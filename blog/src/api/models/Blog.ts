import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export interface Comment {
  _id?: string;
  content: string;
  author: string;
  createdAt?: Date;
}

export interface BlogDocument extends mongoose.Document {
  id: string;
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: string | mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
  isPublished?: boolean;
  slug?: string;
  views?: number;
  likes?: string[];
  comments?: Comment[];
  tags?: string[];
  imageUrl?: string;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  summary?: string;
  isPublished: boolean;
  slug: string;
  views: number;
  likes: string[];
  comments: Comment[];
}

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  summary: {
    type: String,
    required: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  slug: {
    type: String,
    required: false
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: String,
    ref: 'User'
  }],
  comments: [CommentSchema],
  tags: [{
    type: String
  }],
  imageUrl: {
    type: String
  }
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
      if (ret.author && typeof ret.author === 'object' && ret.author._id) {
        ret.author = ret.author._id.toString();
      }
      if (Array.isArray(ret.likes)) {
        ret.likes = ret.likes.map((like: any) => 
          typeof like === 'object' && like._id ? like._id.toString() : like.toString()
        );
      }
    }
  }
});

export const Blog = mongoose.models.Blog || mongoose.model<BlogDocument>('Blog', BlogSchema);
