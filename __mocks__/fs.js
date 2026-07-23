// __mocks__/fs.js
const path = require('path');

let inMemoryFs = {};

const fsPromises = {
    readFile: jest.fn(async (filePath) => {
        const absolutePath = path.resolve(filePath);
        console.log(`[Mock FS] Reading from: ${absolutePath}`); // Debug log
        if (inMemoryFs[absolutePath]) {
            return inMemoryFs[absolutePath];
        }
        const error = new Error(`ENOENT: no such file or directory, open '${absolutePath}'`);
        error.code = 'ENOENT';
        throw error;
    }),
    writeFile: jest.fn(async (filePath, data) => {
        const absolutePath = path.resolve(filePath);
        console.log(`[Mock FS] Writing to: ${absolutePath}`); // Debug log
        inMemoryFs[absolutePath] = data;
    }),
    unlink: jest.fn(async (filePath) => {
        const absolutePath = path.resolve(filePath);
        delete inMemoryFs[absolutePath];
    }),
    mkdir: jest.fn(async () => {}), // Mock mkdir to do nothing
};

// Function to reset the in-memory file system for each test
const __resetInMemoryFs = () => {
    inMemoryFs = {};
    fsPromises.readFile.mockClear();
    fsPromises.writeFile.mockClear();
    fsPromises.unlink.mockClear();
    fsPromises.mkdir.mockClear();
};

const __getInMemoryFs = () => inMemoryFs;

module.exports = {
    promises: fsPromises,
    __resetInMemoryFs,
    __getInMemoryFs,
    ...jest.requireActual('fs') // Include other fs exports if needed, but not promises
};