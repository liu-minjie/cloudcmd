'use strict';

const path = require('path');
const test = require('tape');

const diff = require('sinon-called-with-diff');
const sinon = diff(require('sinon'));

const {promisify} = require('es6-promisify');
const pullout = require('pullout');
const request = require('request');

const dir = path.join(__dirname, '..', '..');
const modulesPath = path.join(dir, 'json', 'modules.json');

const localModules  = require(modulesPath);
const modulas = require(`${dir}/server/modulas`);

const warp = (fn, ...a) => (...b) => fn(...b, ...a);
const _pullout = promisify(pullout);

const get = promisify((url, fn) => {
    fn(null, request(url));
});

const getJSON = (url) => {
    return get(url)
        .then(warp(_pullout, 'string'))
        .then(JSON.parse);
};

const {connect} = require('../before');

test('cloudcmd: modules', async (t) => {
    const modules = {
        data: {
            FilePicker: {
                key: 'hello'
            }
        }
    };
    
    const expected = {
        ...localModules,
        ...modules,
    };
    const {port, done} = await connect({modules});
    const result = await getJSON(`http://localhost:${port}/json/modules.json`);
    
    t.deepEqual(result, expected, 'should equal');
    t.end();
    
    done();
});

test('cloudcmd: modules: wrong route', async (t) => {
    const modules = {
        hello: 'world'
    };
    
    const expected = {
        ...localModules,
        ...modules,
    };
    
    const {port, done} = await connect({modules});
    const result = await getJSON(`http://localhost:${port}/package.json`);
    
    t.notDeepEqual(result, expected, 'should not be equal');
    t.end();
    
    done();
});

test('cloudcmd: modules: no', (t) => {
    const fn = modulas();
    const url = '/json/modules.json';
    const send = sinon.stub();
    
    fn({url}, {send});
    
    t.ok(send.calledWith(localModules), 'should have been called with modules');
    t.end();
});

