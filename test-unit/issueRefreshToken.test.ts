describe('issueRefreshToken', () => {
  it('should issue different tokens all the time', () => {
    expect(issueRefreshToken()).not.toBe(issueRefreshToken())
  })
})
