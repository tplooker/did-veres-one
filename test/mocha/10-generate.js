/*
 * Copyright (c) 2018 Veres One Project. All rights reserved.
 */
/* global should */
'use strict';

const bedrock = require('bedrock');
const expect = global.chai.expect;

describe('Veres One DIDs', () => {
  const didv1 = require('../../lib');

  it('should generate nym-based DID Document', async () => {
    const nymOptions = {
      passphrase: 'foobar'
    };
    let didDocument = await didv1.generate(nymOptions);

    expect(didDocument.publicDidDocument.id).to.match(/^did\:v1\:nym\:.*/);
    expect(
      didDocument.publicDidDocument.authentication[0].publicKey.publicKeyPem)
      .to.have.string('-----BEGIN PUBLIC KEY-----');
    expect(
      didDocument.privateDidDocument.authentication[0].publicKey.privateKeyPem)
      .to.have.string('-----BEGIN ENCRYPTED PRIVATE KEY-----');
  }).timeout(30000);

  it('should generate uuid-based DID Document', async () => {
    const uuidOptions = {
      didType: 'uuid'
    };
    let didDocument = await didv1.generate(uuidOptions);

    expect(didDocument.publicDidDocument.id).to.match(/^did\:v1\:uuid\:.*/);
  });

});
