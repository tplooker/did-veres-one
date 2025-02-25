/*!
 * Copyright (c) 2018-2019 Veres One Project. All rights reserved.
 */
'use strict';

const nock = require('nock');
const chai = require('chai');
chai.should();

const {expect} = chai;

const tls = require('tls');
tls.DEFAULT_ECDH_CURVE = 'auto';

const {VeresOneClient} = require('../lib/index');

const TEST_HOSTNAME = 'genesis.bee.veres.one';
const TEST_DID = 'did:v1:test:nym:2pfPix2tcwa7gNoMRxdcHbEyFGqaVBPNntCsDZexVeHX';
const TEST_DID_RESULT = require('./dids/genesis.bee.did.json');
const LEDGER_AGENTS_DOC = require('./dids/ledger-agents.json');
const LEDGER_AGENT_STATUS = require('./dids/ledger-agent-status.json');
const ACCELERATOR_RESPONSE = require('./dids/accelerator-response.json');

describe('web ledger client', () => {
  let client;

  beforeEach(() => {
    client = new VeresOneClient({
      mode: 'test', hostname: TEST_HOSTNAME
    });
  });

  describe('veres one client', () => {
    describe('get', () => {
      it('should fetch a did doc from ledger via https', async () => {
        nock('https://genesis.bee.veres.one')
          .get(`/ledger-agents`)
          .reply(200, LEDGER_AGENTS_DOC);

        const {ledgerAgent: [{service: {ledgerQueryService}}]} =
          LEDGER_AGENTS_DOC;
        nock(ledgerQueryService)
          .post('/?id=' + encodeURIComponent(TEST_DID))
          .reply(200, TEST_DID_RESULT);

        _nockLedgerAgentStatus();

        const result = await client.get({did: TEST_DID});
        expect(result.doc.id).to.equal(TEST_DID);
        expect(result.meta.sequence).to.equal(0);
      });

      it('should fetch just a key object from a did: with hash', async () => {
        nock('https://genesis.bee.veres.one')
          .get(`/ledger-agents`)
          .reply(200, LEDGER_AGENTS_DOC);

        const {ledgerAgent: [{service: {ledgerQueryService}}]} =
          LEDGER_AGENTS_DOC;
        nock(ledgerQueryService)
          .post('/?id=' + encodeURIComponent(TEST_DID))
          .reply(200, TEST_DID_RESULT);

        _nockLedgerAgentStatus();

        const testKeyId = TEST_DID + '#authn-1';

        /* eslint-disable quotes, quote-props */
        const expectedDoc = {
          "@context": [
            "https://w3id.org/did/v0.11", "https://w3id.org/veres-one/v1"
          ],
          "id": "did:v1:test:nym:" +
            "2pfPix2tcwa7gNoMRxdcHbEyFGqaVBPNntCsDZexVeHX#authn-1",
          "type": "Ed25519VerificationKey2018",
          "controller": "did:v1:test:" +
            "nym:2pfPix2tcwa7gNoMRxdcHbEyFGqaVBPNntCsDZexVeHX",
          "publicKeyBase58": "2pfPix2tcwa7gNoMRxdcHbEyFGqaVBPNntCsDZexVeHX"
        };
        /* eslint-enable quote, quote-props */

        const result = await client.get({did: testKeyId});

        expect(result.doc).to.eql(expectedDoc);
      });
    });

    describe.skip('sendToAccelerator', () => {
      it('should send an operation to an accelerator service', async () => {
        nock('https://genesis.bee.veres.one')
          .post(`/accelerator/proofs`)
          .reply(200, ACCELERATOR_RESPONSE);

        /* eslint-disable quotes, quote-props */
        const operation = {
          "@context": "https://w3id.org/veres-one/v1",
          "type": "CreateWebLedgerRecord",
          "record": {
            "@context": "https://w3id.org/veres-one/v1",
            "id": "did:v1:test:uuid:ad33d59b630f44d49bdfb8266d4a243e"
          }
        };
        /* eslint-enable quote, quote-props */

        const result = await client.sendToAccelerator({
          operation,
          hostname: TEST_HOSTNAME
        });

        const body = result.data;

        expect(body).to.have.property('proof');
      });
    });
  });
});

function _nockLedgerAgentStatus() {
  const {ledgerAgent: [{service: {ledgerAgentStatusService}}]} =
    LEDGER_AGENTS_DOC;
  nock(ledgerAgentStatusService)
    .get('/')
    .times(2)
    .reply(200, LEDGER_AGENT_STATUS);
}
