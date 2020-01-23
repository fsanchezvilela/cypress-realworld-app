import path from "path";
import v4 from "uuid";
import _ from "lodash";
import low from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import shortid from "shortid";
import {
  BankAccount,
  Transaction,
  User,
  Contact,
  TransactionStatus,
  RequestStatus,
  Like,
  Comment,
  PaymentNotification,
  PaymentNotificationStatus,
  LikeNotification,
  CommentNotification,
  NotificationType,
  NotificationPayloadType,
  NotificationsType
} from "../models";

const USER_TABLE = "users";
const CONTACT_TABLE = "contacts";
const BANK_ACCOUNT_TABLE = "bankaccounts";
const TRANSACTION_TABLE = "transactions";
const LIKE_TABLE = "likes";
const COMMENT_TABLE = "comments";
const NOTIFICATION_TABLE = "notifications";

const testSeed = require(path.join(__dirname, "../data/", "test-seed.json"));
let databaseFileName;

if (process.env.NODE_ENV === "test") {
  databaseFileName = "database.test.json";
} else {
  databaseFileName = "database.json";
}

const databaseFile = path.join(__dirname, "../data", databaseFileName);
const adapter = new FileSync(databaseFile);

const db = () => low(adapter);

export const seedDatabase = () => {
  // seed database with test data
  // @ts-ignore
  db()
    .setState(testSeed)
    .write();
};
export const getAllUsers = () =>
  db()
    .get(USER_TABLE)
    .value();

export const getAllContacts = () =>
  db()
    .get(CONTACT_TABLE)
    .value();

export const getAllTransactions = () =>
  db()
    .get(TRANSACTION_TABLE)
    .value();

export const getAllPublicTransactions = () =>
  db()
    .get(TRANSACTION_TABLE)
    // @ts-ignore
    .filter({ privacyLevel: "public" })
    .value();

export const getAllBy = (entity: string, key: string, value: any) => {
  const result = db()
    .get(entity)
    // @ts-ignore
    .filter({ [`${key}`]: value })
    .value();

  return result;
};

export const getBy = (entity: string, key: string, value: any) => {
  const result = db()
    .get(entity)
    // @ts-ignore
    .find({ [`${key}`]: value })
    .value();

  return result;
};

export const getAllByObj = (entity: string, query: object) =>
  db()
    .get(entity)
    // @ts-ignore
    .filter(query)
    .value();

export const getByObj = (entity: string, query: object) =>
  db()
    .get(entity)
    // @ts-ignore
    .find(query)
    .value();

// convenience methods

// User
export const getUserBy = (key: string, value: any) =>
  getBy(USER_TABLE, key, value);
export const getUsersBy = (key: string, value: any) => {
  getAllBy(USER_TABLE, key, value);
};

export const createUser = (userDetails: Partial<User>): User => {
  const user: User = {
    id: shortid(),
    uuid: v4(),
    firstName: userDetails.firstName!,
    lastName: userDetails.lastName!,
    username: userDetails.username!,
    password: userDetails.password!,
    email: userDetails.email!,
    phoneNumber: userDetails.phoneNumber!,
    balance: userDetails.balance!,
    avatar: userDetails.avatar!,
    defaultPrivacyLevel: userDetails.defaultPrivacyLevel!,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  saveUser(user);
  return user;
};

const saveUser = (user: User) => {
  db()
    .get(USER_TABLE)
    // @ts-ignore
    .push(user)
    .write();
};

export const updateUserById = (userId: string, edits: Partial<User>) => {
  const user = getUserBy("id", userId);

  if (user) {
    db()
      .get(USER_TABLE)
      // @ts-ignore
      .find(user)
      .assign(edits)
      .write();
  }
};

// Contact
export const getContactBy = (key: string, value: any) =>
  getBy(CONTACT_TABLE, key, value);
export const getContactsBy = (key: string, value: any) =>
  getAllBy(CONTACT_TABLE, key, value);

export const getContactsByUsername = (username: string) => {
  const user: User = getUserBy("username", username);
  const userContacts: Contact[] = getContactsBy("userId", user.id);
  return userContacts;
};

export const getContactsByUserId = (userId: string): Contact[] =>
  getContactsBy("userId", userId);

export const createContact = (contact: Contact) => {
  db()
    .get(CONTACT_TABLE)
    // @ts-ignore
    .push(contact)
    .write();

  // manual lookup after create
  return getContactBy("id", contact.id);
};

export const removeContactById = (contactId: string) => {
  const contact = getContactBy("id", contactId);

  db()
    .get(CONTACT_TABLE)
    // @ts-ignore
    .remove(contact)
    .write();
};

export const createContactForUser = (userId: string, contactUserId: string) => {
  const contactId = shortid();
  const contact: Contact = {
    id: contactId,
    uuid: v4(),
    userId,
    contactUserId,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  // TODO: check if contact exists

  // Write contact record to the database
  const result = createContact(contact);

  return result;
};

// Bank Account
export const getBankAccountBy = (key: string, value: any) =>
  getBy(BANK_ACCOUNT_TABLE, key, value);

export const getBankAccountById = (id: string) => getBankAccountBy("id", id);
export const getBankAccountsBy = (key: string, value: any) => {
  const accounts = getBy(BANK_ACCOUNT_TABLE, key, value);
  return accounts ? Array.of(accounts) : [];
};
export const getBankAccountsByUserId = (userId: string) => {
  const accounts: BankAccount[] = getBankAccountsBy("userId", userId);
  return accounts;
};

export const createBankAccount = (bankaccount: BankAccount) => {
  db()
    .get(BANK_ACCOUNT_TABLE)
    // @ts-ignore
    .push(bankaccount)
    .write();

  // manual lookup after create
  return getBankAccountBy("id", bankaccount.id);
};

export const createBankAccountForUser = (
  userId: string,
  accountDetails: Partial<BankAccount>
) => {
  const accountId = shortid();
  const bankaccount: BankAccount = {
    id: accountId,
    uuid: v4(),
    userId,
    bankName: accountDetails.bankName!,
    accountNumber: accountDetails.accountNumber!,
    routingNumber: accountDetails.routingNumber!,
    isDeleted: false,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  // TODO: check if bank account exists

  // Write bank account record to the database
  const result = createBankAccount(bankaccount);

  return result;
};

export const removeBankAccountById = (bankAccountId: string) => {
  db()
    .get(BANK_ACCOUNT_TABLE)
    // @ts-ignore
    .find({ id: bankAccountId })
    .assign({ isDeleted: true }) // soft delete
    .write();
};

// Transaction

export const getTransactionBy = (key: string, value: any) =>
  getBy(TRANSACTION_TABLE, key, value);

export const getTransactionById = (id: string) => getTransactionBy("id", id);
export const getTransactionsBy = (key: string, value: string) =>
  getAllBy(TRANSACTION_TABLE, key, value);
export const getTransactionsByObj = (query: object) =>
  getAllByObj(TRANSACTION_TABLE, query);
export const getTransactionsForUserByObj = (userId: string, query?: object) => {
  const transactions: Transaction[] = getTransactionsByObj({
    receiverId: userId,
    ...query
  });
  return transactions;
};
export const getTransactionsByUserId = (userId: string) => {
  const transactions: Transaction[] = getTransactionsBy("receiverId", userId);
  return transactions;
};

export const getTransactionsForUserContacts = (
  userId: string,
  query?: object
) => {
  const contacts = getContactsByUserId(userId);
  const contactIds = _.map(contacts, "contactUserId");
  return contactIds.flatMap((contactId): Transaction[] => {
    return getTransactionsForUserByObj(contactId, query);
  });
};

export const getPublicTransactionsDefaultSort = (userId: string) => {
  const contactsTransactions = getTransactionsForUserContacts(userId);
  const contactsTransactionIds = _.map(contactsTransactions, "id");
  const allPublicTransactions = getAllPublicTransactions();

  const nonContactPublicTransactions = _.reject(allPublicTransactions, t =>
    _.includes(contactsTransactionIds, t.id)
  );

  return {
    contacts: contactsTransactions,
    public: nonContactPublicTransactions
  };
};

export const createTransaction = (
  userId: User["id"],
  transactionType: "payment" | "request",
  transactionDetails: Partial<Transaction>
): Transaction => {
  const transaction: Transaction = {
    id: shortid(),
    uuid: v4(),
    source: transactionDetails.source!,
    amount: transactionDetails.amount!,
    description: transactionDetails.description!,
    receiverId: transactionDetails.receiverId!,
    senderId: userId,
    privacyLevel: transactionDetails.privacyLevel!,
    status: TransactionStatus.pending,
    requestStatus:
      transactionType === "request" ? RequestStatus.pending : undefined,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  const savedTransaction = saveTransaction(transaction);
  return savedTransaction;
};
const saveTransaction = (transaction: Transaction): Transaction => {
  db()
    .get(TRANSACTION_TABLE)
    // @ts-ignore
    .push(transaction)
    .write();

  // manual lookup after transaction created
  return getTransactionBy("id", transaction.id);
};

export const updateTransactionById = (
  userId: string,
  transactionId: string,
  edits: Partial<Transaction>
) => {
  const transaction = getTransactionBy("id", transactionId);

  if (userId === transaction.senderId || userId === transaction.receiverId) {
    db()
      .get(TRANSACTION_TABLE)
      // @ts-ignore
      .find(transaction)
      .assign(edits)
      .write();
  }
};

// Likes

export const getLikeBy = (key: string, value: any): Like =>
  getBy(LIKE_TABLE, key, value);
export const getLikesByObj = (query: object) => getAllByObj(LIKE_TABLE, query);

export const getLikeById = (id: string): Like => getLikeBy("id", id);
export const getLikesByTransactionId = (transactionId: string) =>
  getLikesByObj({ transactionId });

export const createLike = (userId: string, transactionId: string): Like => {
  const like = {
    id: shortid(),
    uuid: v4(),
    userId,
    transactionId,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  const savedLike = saveLike(like);
  return savedLike;
};

const saveLike = (like: Like): Like => {
  db()
    .get(LIKE_TABLE)
    // @ts-ignore
    .push(like)
    .write();

  // manual lookup after like created
  return getLikeById(like.id);
};

// Comments

export const getCommentBy = (key: string, value: any): Comment =>
  getBy(COMMENT_TABLE, key, value);
export const getCommentsByObj = (query: object) =>
  getAllByObj(COMMENT_TABLE, query);

export const getCommentById = (id: string): Comment => getCommentBy("id", id);
export const getCommentsByTransactionId = (transactionId: string) =>
  getCommentsByObj({ transactionId });

export const createComment = (
  userId: string,
  transactionId: string,
  content: string
): Comment => {
  const comment = {
    id: shortid(),
    uuid: v4(),
    content,
    userId,
    transactionId,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  const savedComment = saveComment(comment);
  return savedComment;
};

const saveComment = (comment: Comment): Comment => {
  db()
    .get(COMMENT_TABLE)
    // @ts-ignore
    .push(comment)
    .write();

  // manual lookup after comment created
  return getCommentById(comment.id);
};

// Notifications

export const getNotificationBy = (key: string, value: any): NotificationType =>
  getBy(NOTIFICATION_TABLE, key, value);

export const getNotificationsByObj = (query: object): Notification[] =>
  getAllByObj(NOTIFICATION_TABLE, query);

export const getNotificationById = (id: string): NotificationType =>
  getNotificationBy("id", id);

export const getNotificationsByUserId = (userId: string) =>
  getNotificationsByObj({ userId });

export const getNotificationsByTransactionId = (transactionId: string) =>
  getNotificationsByObj({ transactionId });

export const getNotificationsByLikeId = (likeId: string) =>
  getNotificationsByObj({ likeId });

export const getNotificationsByCommentId = (commentId: string) =>
  getNotificationsByObj({ commentId });

export const createPaymentNotification = (
  userId: string,
  transactionId: string,
  status: PaymentNotificationStatus
): PaymentNotification => {
  const notification: PaymentNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    status,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  saveNotification(notification);
  return notification;
};

export const createLikeNotification = (
  userId: string,
  transactionId: string,
  likeId: string
): LikeNotification => {
  const notification: LikeNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    likeId: likeId,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  saveNotification(notification);
  return notification;
};

export const createCommentNotification = (
  userId: string,
  transactionId: string,
  commentId: string
): CommentNotification => {
  const notification: CommentNotification = {
    id: shortid(),
    uuid: v4(),
    userId: userId,
    transactionId: transactionId,
    commentId: commentId,
    isRead: false,
    createdAt: new Date(),
    modifiedAt: new Date()
  };

  saveNotification(notification);
  return notification;
};

const saveNotification = (notification: NotificationType) => {
  db()
    .get(NOTIFICATION_TABLE)
    // @ts-ignore
    .push(notification)
    .write();
};

export const createNotifications = (
  userId: string,
  notifications: NotificationPayloadType[]
) =>
  notifications.flatMap((item: NotificationPayloadType) => {
    if ("status" in item && item.type === NotificationsType.payment) {
      return createPaymentNotification(userId, item.transactionId, item.status);
    } else if ("likeId" in item && item.type === NotificationsType.like) {
      return createLikeNotification(userId, item.transactionId, item.likeId);
    } else {
      if ("commentId" in item) {
        return createCommentNotification(
          userId,
          item.transactionId,
          item.commentId
        );
      }
    }
  });

export const updateNotificationById = (
  userId: string,
  notificationId: string,
  edits: Partial<NotificationType>
) => {
  const notification = getNotificationBy("id", notificationId);

  if (userId === notification.userId) {
    db()
      .get(NOTIFICATION_TABLE)
      // @ts-ignore
      .find(notification)
      .assign(edits)
      .write();
  }
};

// dev/test private methods
export const getRandomUser = () => {
  const users = getAllUsers();
  return _.sample(users);
};

export default db;