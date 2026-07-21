describe('Paint the Town App', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have correct app name', () => {
    const pkg = require('../package.json');
    expect(pkg.name).toBe('paint-the-town');
  });
});