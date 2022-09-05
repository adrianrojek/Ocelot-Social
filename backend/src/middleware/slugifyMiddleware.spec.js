import { getNeode, getDriver } from '../db/neo4j'
import createServer from '../server'
import { createTestClient } from 'apollo-server-testing'
import Factory, { cleanDatabase } from '../db/factories'
import { createGroupMutation } from '../db/graphql/groups'
import { createPostMutation } from '../db/graphql/posts'
import { signupVerificationMutation } from '../db/graphql/authentications'

let authenticatedUser
let variables

const driver = getDriver()
const neode = getNeode()
const descriptionAdditional100 =
  ' 123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789-123456789'

const { server } = createServer({
  context: () => {
    return {
      driver,
      neode,
      user: authenticatedUser,
    }
  },
})

const { mutate } = createTestClient(server)

beforeAll(async () => {
  await cleanDatabase()
})

afterAll(async () => {
  await cleanDatabase()
})

beforeEach(async () => {
  variables = {}
  const admin = await Factory.build('user', {
    role: 'admin',
  })
  await Factory.build(
    'user',
    {},
    {
      email: 'someone@example.org',
      password: '1234',
    },
  )
  await Factory.build('category', {
    id: 'cat9',
    name: 'Democracy & Politics',
    icon: 'university',
  })
  authenticatedUser = await admin.toJson()
})

// TODO: avoid database clean after each test in the future if possible for performance and flakyness reasons by filling the database step by step, see issue https://github.com/Ocelot-Social-Community/Ocelot-Social/issues/4543
afterEach(async () => {
  await cleanDatabase()
})

describe('slugifyMiddleware', () => {
  describe('CreateGroup', () => {
    const categoryIds = ['cat9']

    beforeEach(() => {
      variables = {
        ...variables,
        name: 'The Best Group',
        about: 'Some about',
        description: 'Some description' + descriptionAdditional100,
        groupType: 'closed',
        actionRadius: 'national',
        categoryIds,
      }
    })

    describe('if slug not exists', () => {
      it('generates a slug based on name', async () => {
        await expect(
          mutate({
            mutation: createGroupMutation,
            variables,
          }),
        ).resolves.toMatchObject({
          data: {
            CreateGroup: {
              name: 'The Best Group',
              slug: 'the-best-group',
              about: 'Some about',
              description: 'Some description' + descriptionAdditional100,
              groupType: 'closed',
              actionRadius: 'national',
            },
          },
        })
      })

      it('generates a slug based on given slug', async () => {
        await expect(
          mutate({
            mutation: createGroupMutation,
            variables: {
              ...variables,
              slug: 'the-group',
            },
          }),
        ).resolves.toMatchObject({
          data: {
            CreateGroup: {
              slug: 'the-group',
            },
          },
        })
      })
    })

    describe('if slug exists', () => {
      beforeEach(async () => {
        await mutate({
          mutation: createGroupMutation,
          variables: {
            ...variables,
            name: 'Pre-Existing Group',
            slug: 'pre-existing-group',
            about: 'As an about',
          },
        })
      })

      it('chooses another slug', async () => {
        variables = {
          ...variables,
          name: 'Pre-Existing Group',
          about: 'As an about',
        }
        await expect(
          mutate({
            mutation: createGroupMutation,
            variables,
          }),
        ).resolves.toMatchObject({
          data: {
            CreateGroup: {
              slug: 'pre-existing-group-1',
            },
          },
        })
      })

      describe('but if the client specifies a slug', () => {
        it('rejects CreateGroup', async (done) => {
          variables = {
            ...variables,
            name: 'Pre-Existing Group',
            about: 'As an about',
            slug: 'pre-existing-group',
          }
          try {
            await expect(
              mutate({ mutation: createGroupMutation, variables }),
            ).resolves.toMatchObject({
              errors: [
                {
                  message: 'Group with this slug already exists!',
                },
              ],
            })
            done()
          } catch (error) {
            throw new Error(`
              ${error}

              Probably your database has no unique constraints!

              To see all constraints go to http://localhost:7474/browser/ and
              paste the following:
              \`\`\`
                CALL db.constraints();
              \`\`\`

              Learn how to setup the database here:
              https://github.com/Ocelot-Social-Community/Ocelot-Social/blob/master/backend/README.md#database-indices-and-constraints
            `)
          }
        })
      })
    })
  })

  describe('CreatePost', () => {
    const categoryIds = ['cat9']

    beforeEach(() => {
      variables = {
        ...variables,
        title: 'I am a brand new post',
        content: 'Some content',
        categoryIds,
      }
    })

    describe('if slug not exists', () => {
      it('generates a slug based on title', async () => {
        await expect(
          mutate({
            mutation: createPostMutation,
            variables,
          }),
        ).resolves.toMatchObject({
          data: {
            CreatePost: {
              slug: 'i-am-a-brand-new-post',
            },
          },
        })
      })

      it('generates a slug based on given slug', async () => {
        await expect(
          mutate({
            mutation: createPostMutation,
            variables: {
              ...variables,
              slug: 'the-post',
            },
          }),
        ).resolves.toMatchObject({
          data: {
            CreatePost: {
              slug: 'the-post',
            },
          },
        })
      })
    })

    describe('if slug exists', () => {
      beforeEach(async () => {
        await Factory.build(
          'post',
          {
            title: 'Pre-existing post',
            slug: 'pre-existing-post',
            content: 'as Someone else content',
          },
          {
            categoryIds,
          },
        )
      })

      it('chooses another slug', async () => {
        variables = {
          ...variables,
          title: 'Pre-existing post',
          content: 'Some content',
          categoryIds,
        }
        await expect(
          mutate({
            mutation: createPostMutation,
            variables,
          }),
        ).resolves.toMatchObject({
          data: {
            CreatePost: {
              slug: 'pre-existing-post-1',
            },
          },
        })
      })

      describe('but if the client specifies a slug', () => {
        it('rejects CreatePost', async (done) => {
          variables = {
            ...variables,
            title: 'Pre-existing post',
            content: 'Some content',
            slug: 'pre-existing-post',
            categoryIds,
          }
          try {
            await expect(
              mutate({ mutation: createPostMutation, variables }),
            ).resolves.toMatchObject({
              errors: [
                {
                  message: 'Post with this slug already exists!',
                },
              ],
            })
            done()
          } catch (error) {
            throw new Error(`
              ${error}

              Probably your database has no unique constraints!

              To see all constraints go to http://localhost:7474/browser/ and
              paste the following:
              \`\`\`
                CALL db.constraints();
              \`\`\`

              Learn how to setup the database here:
              https://github.com/Ocelot-Social-Community/Ocelot-Social/blob/master/backend/README.md#database-indices-and-constraints
            `)
          }
        })
      })
    })
  })

  describe('SignupVerification', () => {
    beforeEach(() => {
      variables = {
        ...variables,
        name: 'I am a user',
        nonce: '12345',
        password: 'yo',
        email: '123@example.org',
        termsAndConditionsAgreedVersion: '0.0.1',
      }
    })

    describe('given a user has signed up with their email address', () => {
      beforeEach(async () => {
        await Factory.build('emailAddress', {
          email: '123@example.org',
          nonce: '12345',
          verifiedAt: null,
        })
      })

      describe('if slug not exists', () => {
        it('generates a slug based on name', async () => {
          await expect(
            mutate({
              mutation: signupVerificationMutation,
              variables,
            }),
          ).resolves.toMatchObject({
            data: {
              SignupVerification: {
                slug: 'i-am-a-user',
              },
            },
          })
        })

        it('generates a slug based on given slug', async () => {
          await expect(
            mutate({
              mutation: signupVerificationMutation,
              variables: {
                ...variables,
                slug: 'the-user',
              },
            }),
          ).resolves.toMatchObject({
            data: {
              SignupVerification: {
                slug: 'the-user',
              },
            },
          })
        })
      })

      describe('if slug exists', () => {
        beforeEach(async () => {
          await Factory.build('user', {
            name: 'I am a user',
            slug: 'i-am-a-user',
          })
        })

        it('chooses another slug', async () => {
          await expect(
            mutate({
              mutation: signupVerificationMutation,
              variables,
            }),
          ).resolves.toMatchObject({
            data: {
              SignupVerification: {
                slug: 'i-am-a-user-1',
              },
            },
          })
        })

        describe('but if the client specifies a slug', () => {
          beforeEach(() => {
            variables = {
              ...variables,
              slug: 'i-am-a-user',
            }
          })

          it('rejects SignupVerification (on FAIL Neo4j constraints may not defined in database)', async () => {
            await expect(
              mutate({
                mutation: signupVerificationMutation,
                variables,
              }),
            ).resolves.toMatchObject({
              errors: [
                {
                  message: 'User with this slug already exists!',
                },
              ],
            })
          })
        })
      })
    })
  })
})
