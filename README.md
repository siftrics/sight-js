This repository contains the official [Sight API](https://siftrics.com/) Node.js client. The Sight API is a text recognition service.

# Quickstart

1. Install the node module.

```
npm install sight-api
```


2. Grab an API key from the [Sight dashboard](https://siftrics.com/).
3. Create a client, passing your API key into the constructor, and recognize text:

```
const sight = require('sight-api');

const s = new sight.Client('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');

s.recognize(['invoice_1.pdf', 'my_receipt.png'])
    .then(pages => {
        console.log(pages);
    })
    .catch(error => {
        console.error(error);
    });
```

`pages` looks like this:

```
[
  {
    "Error": "",
    "FileIndex": 0,
    "PageNumber": 1,
    "NumberOfPagesInFile": 3,
    "RecognizedText": [ ... ]
  },
  ...
]
```

`FileIndex` is the index of this file in the original request's "files" array.

`RecognizedText` looks like this:

```
"RecognizedText": [
  {
    "Text": "Invoice",
    "Confidence": 0.22863210084975458
    "TopLeftX": 395,
    "TopLeftY": 35,
    "TopRightX": 449,
    "TopRightY": 35,
    "BottomLeftX": 395,
    "BottomLeftY": 47,
    "BottomRightX": 449,
    "BottomRightY": 47
  },
  ...
]
```

## Word-Level Bounding Boxes

`client.recognize([ ... ], words=False)` has a default parameter, `words`, which defaults to `false`, but if it's set to `true` then word-level bounding boxes are returned instead of sentence-level bounding boxes.

### Auto-Rotate

The Sight API can rotate and return input images so the majority of the recognized text is upright. Note that this feature is part of the "Advanced" Sight API and therefore each page processed with this behavior enabled is billed as 4 pages. To enable this behavior, call the recognize function with the default parameter `autoRotate` set to `true`:

```
client.recognize(['invoice.pdf'], autoRotate=True)
```

Now, the `Base64Image` field will be set in the elements of the resolved `pages`.

### Why are the bounding boxes are rotated 90 degrees?

Some images, particularly .jpeg images, use the [EXIF](https://en.wikipedia.org/wiki/Exif) data format. This data format contains a metadata field indicating the orientation of an image --- i.e., whether the image should be rotated 90 degrees, 180 degrees, flipped horizontally, etc., when viewing it in an image viewer.

This means that when you view such an image in Chrome, Firefox, Safari, or the stock Windows and Mac image viewer applications, it will appear upright, despite the fact that the underlying pixels of the image are encoded in a different orientation.

If you find your bounding boxes are rotated or flipped relative to your image, it is because the image decoder you are using to load images in your program obeys EXIF orientation, but the Sight API ignores it (or vice versa).

All the most popular imaging libraries in Go, such as "image" and "github.com/disintegration/imaging", ignore EXIF orientation. You should determine whether your image decoder obeys EXIF orientation and tell the Sight API to do the same thing. You can tell the Sight API to obey the EXIF orientation by calling the recognize function with the default parameter `exifRotate` set to `true`:

```
client.recognize(['invoice.pdf'], exifRotate=True)
```

By default, the Sight API ignores EXIF orientation.


## Official API Documentation

Here is the [official documentation for the Sight API](https://siftrics.com/docs/sight.html).

# Apache V2 License

This code is licensed under Apache V2.0. The full text of the license can be found in the "LICENSE" file.
