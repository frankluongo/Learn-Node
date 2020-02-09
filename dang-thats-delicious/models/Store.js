const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slugs");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: "Please enter a store name!"
    },
    slug: String,
    description: {
      type: String,
      trim: true
    },
    tags: [String],
    created: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: [
        {
          type: Number,
          required: "You must supply coordinates"
        }
      ],
      address: {
        type: String,
        required: "You must supply an address!"
      }
    },
    photo: String,
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: "You must supply an author!"
    }
  },
  // Here we're telling MongoDB to add virtuals to JSON
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Define our indexes
storeSchema.index({
  name: "text",
  description: "text"
});

storeSchema.index({
  location: "2dsphere"
});

// Pre Save Functions

storeSchema.pre("save", async function(next) {
  if (!this.isModified("name")) {
    next();
    return;
  }
  this.slug = slug(this.name);
  // Find other stores that have the same slug
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
  // Search for slugs that START WITH (^) the slug name and MIGHT (?) END WITH ($) a dash and number
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }
  next();
});

//
// Aggregations
//

storeSchema.statics.getTagsList = function() {
  // Go to https://docs.mongodb.com/manual/reference/operator/aggregation/ to see these
  return this.aggregate([
    // Unwind the data by the tags field
    {
      $unwind: "$tags"
    },
    // Group the unwinded data into objects with the tag name as the ID and the count consisting of the number of unwinded objects with that tag
    {
      $group: {
        _id: "$tags",
        count: { $sum: 1 }
      }
    },
    // Sort the groups by their counts
    { $sort: { count: -1 } }
  ]);
};

storeSchema.statics.getTopStores = function() {
  return this.aggregate([
    // 1. Lookup Stores & Populate Their Reviews
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "store",
        as: "reviews"
      }
    },
    // 2. Filter for items that have 2 or more reviews
    {
      $match: {
        "reviews.1": {
          $exists: true
        }
      }
    },
    // 3. Add the average reviews field
    {
      $project: {
        photo: "$$ROOT.photo",
        name: "$$ROOT.name",
        reviews: "$$ROOT.reviews",
        slug: "$$ROOT.slug",
        averageRating: { $avg: "$reviews.rating" }
      }
    },
    // 4. Sort it by our new field, highest reviews first
    {
      $sort: { averageRating: -1 }
    },
    // 5. Limit to 10
    {
      $limit: 10
    }
  ]);
};

//
// Virtual Fields
//
// Virtual fields will only show up if you ask for them
storeSchema.virtual("reviews", {
  ref: "Review", // What model to link
  localField: "_id", // which field on the store?
  foreignField: "store" // which field on the review?
});

//
// Autopopulators
//

function autopopulate(next) {
  this.populate("reviews");
  next();
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model("Store", storeSchema);
