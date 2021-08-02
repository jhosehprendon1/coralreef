// Import all functions from put-nft.js
const lambda = require('../../../src/handlers/put-nft.js');
// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');

// This includes all tests for putNftHandler()
describe('Test putNftHandler', function () {
  let putSpy;

  // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
  beforeAll(() => {
    // Mock dynamodb get and put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put');
  });

  // Clean up mocks
  afterAll(() => {
    putSpy.mockRestore();
  });

  // This test invokes putNftHandler() and compare the result
  it('should add id to the table', async () => {
    const returnedNft = { id: 'id1', name: 'name1' };

    // Return the specified value whenever the spied put function is called
    putSpy.mockReturnValue({
      promise: () => Promise.resolve(returnedNft),
    });

    const event = {
      httpMethod: 'POST',
      body: '{"id": "id1","name": "name1"}',
    };

    // Invoke putNftHandler()
    const result = await lambda.putNftHandler(event);
    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(returnedNft),
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
