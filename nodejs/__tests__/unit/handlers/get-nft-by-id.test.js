// Import all functions from get-nft-by-id.js
const lambda = require('../../../src/handlers/get-nft-by-id.js');
// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');

// This includes all tests for getNftByIdHandler()
describe('Test getNftByIdHandler', () => {
  let getSpy;

  // Test one-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
  beforeAll(() => {
    // Mock dynamodb get and put methods
    // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
    getSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'get');
  });

  // Clean up mocks
  afterAll(() => {
    getSpy.mockRestore();
  });

  // This test invokes getNftByIdHandler() and compare the result
  it('should get nft by id', async () => {
    const nft = { id: 'id1' };

    // Return the specified value whenever the spied get function is called
    getSpy.mockReturnValue({
      promise: () => Promise.resolve({ Item: nft }),
    });

    const event = {
      httpMethod: 'GET',
      pathParameters: {
        id: 'id1',
      },
    };

    // Invoke getNftByIdHandler()
    const result = await lambda.getNftByIdHandler(event);

    const expectedResult = {
      statusCode: 200,
      body: JSON.stringify(nft),
    };

    // Compare the result with the expected result
    expect(result).toEqual(expectedResult);
  });
});
