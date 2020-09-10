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

## Official API Documentation

Here is the [official documentation for the Sight API](https://siftrics.com/docs/sight.html).

# Apache V2 License

This code is licensed under Apache V2.0. The full text of the license can be found in the "LICENSE" file.
