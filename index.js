// Copyright © 2020 Siftrics
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

const fs = require('fs');
const https = require('https');

class Client {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    doPoll(pollingURL, numFiles) {
        return new Promise((resolve, reject) => {
            const fileIndex2HaveSeenPage = {};
            let pages = [];
            const intervalId = setInterval(() => {
                const options = {
                    hostname: 'siftrics.com',
                    port: 443,
                    path: pollingURL.substr('https://siftrics.com'.length),
                    method: 'GET',
                    headers: { 'Authorization': 'Basic ' + this.apiKey }
                }
                const req = https.request(options, res => {
                    let chunks = [];
                    res.on('data', chunk => {
                        chunks.push(chunk);
                    }).on('end', () => {
                        const buf = Buffer.concat(chunks);
                        if (res.statusCode != 200) {
                            reject(new Error('non-200 response; ' +
                                             'status code: ' + res.statusCode +
                                             ' body: ' + buf));
                            return;
                        }
                        let json;
                        try {
                            json = JSON.parse(buf);
                        } catch (error) {
                            reject(error);
                            return;
                        }
                        Array.prototype.push.apply(pages, json.Pages);
                        if (json.Pages.length == 0) {
                            return;
                        }
                        for (let k in json.Pages) {
                            const page = json.Pages[k];
                            if (!fileIndex2HaveSeenPage.hasOwnProperty(page.FileIndex)) {
                                fileIndex2HaveSeenPage[page.FileIndex] = [];
                                for (let i = 0; i < page.NumberOfPagesInFile; i++) {
                                    fileIndex2HaveSeenPage[page.FileIndex].push(false);
                                }
                            }
                            fileIndex2HaveSeenPage[page.FileIndex][page.PageNumber-1] = true;
                        }
                        let seenAllPages = true;
                        for (let i = 0; i < numFiles; i++) {
                            if (!fileIndex2HaveSeenPage.hasOwnProperty(i)) {
                                    seenAllPages = false;
                                    break;
                            }
                            for (let k in fileIndex2HaveSeenPage[i]) {
                                if (!fileIndex2HaveSeenPage[i][k]) {
                                    seenAllPages = false;
                                    break;
                                }
                            }
                        }
                        if (seenAllPages) {
                            clearInterval(intervalId);
                            resolve(pages);
                        }
                    });
                })
                req.on('error', error => {
                    reject(error);
                })
                req.end();
            }, 500);
        });
    }

    recognizePayload(payload) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(payload)
            const options = {
                hostname: 'siftrics.com',
                port: 443,
                path: '/api/sight/',
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + this.apiKey,
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }
            const req = https.request(options, res => {
                let chunks = [];
                res.on('data', chunk => {
                    chunks.push(chunk);
                }).on('end', () => {
                    const buf = Buffer.concat(chunks);
                    if (res.statusCode != 200) {
                        reject(new Error('non-200 response; ' +
                                         'status code: ' + res.statusCode +
                                         ' body: ' + buf));
                        return;
                    }
                    let json;
                    try {
                        json = JSON.parse(buf);
                    } catch (error) {
                        reject(error);
                        return;
                    }
                    if (json.hasOwnProperty('PollingURL')) {
                        this.doPoll(json.PollingURL, payload.files.length)
                            .then(pages => { resolve(pages) })
                            .catch(error => { reject(error) });
                        return;
                    }
                    resolve([{
                        Error: '',
                        FileIndex: 0,
                        PageNumber: 1,
                        NumberOfPagesInFile: 1,
                        ...json
                    }]);
                });
            })
            req.on('error', error => {
                reject(error);
            })
            req.write(data);
            req.end();
        });
    }

    recognize(files, words = false, autoRotate = false, exifRotate = false) {
        return new Promise((resolve, reject) => {
            let payload = {
                files: [],
                makeSentences: !words,
                doAutoRotate: autoRotate,
                doExifRotate: exifRotate
            }
            for (let k in files) {
                const file = files[k];
                const fn = file.toLowerCase();
                let mimeType = '';
                if (fn.endsWith('.pdf')) {
                    mimeType = 'application/pdf'
                } else if (fn.endsWith('.bmp')) {
                    mimeType = 'image/bmp'
                } else if (fn.endsWith('.gif')) {
                    mimeType = 'image/gif'
                } else if (fn.endsWith('.jpeg')) {
                    mimeType = 'image/jpeg'
                } else if (fn.endsWith('.jpg')) {
                    mimeType = 'image/jpg'
                } else if (fn.endsWith('.png')) {
                    mimeType = 'image/png'
                } else {
                    reject(new Error('unrecognized file extension. must be pdf, bmp, gif, jpeg, jpg, or png'));
                    return;
                }
                payload.files.push({
                    mimeType: mimeType,
                    base64File: fs.readFileSync(file).toString('base64')
                })
            }
            this.recognizePayload(payload)
                .then(pages => { resolve(pages) })
                .catch(error => { reject(error) });
        });
    }
}

exports.Client = Client;
