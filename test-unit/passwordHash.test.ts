describe('passwordHash', () => {
  it('should hash the password using MD5 algorithm', () => {
    const password = 'myPassword123'
    const hashedPassword = passwordHash(password)

    expect(hashedPassword).toBe('487753b954871b5b05f854060de151d8')
  })
})
