import Joi from 'joi';
import { createValidationError } from './error';

// Validation tipleri
const VALIDATION_TYPES = {
  BODY: 'body',
  QUERY: 'query',
  PARAMS: 'params',
  HEADERS: 'headers',
  FILE: 'file'
};

// Özel validation kuralları
const customRules = {
  password: Joi.string()
    .min(8)
    .max(72)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
  
  email: Joi.string()
    .email({ minDomainSegments: 2 })
    .lowercase()
    .trim(),
  
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .lowercase()
    .trim(),
  
  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/),
  
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] }),
  
  objectId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/),
  
  jwt: Joi.string()
    .pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/)
};

// Validation middleware factory
export const createValidator = (schema, options = {}) => {
  const {
    type = VALIDATION_TYPES.BODY,
    abortEarly = false,
    allowUnknown = true,
    stripUnknown = true,
    context = {},
    customMessages = {},
    customRules: additionalRules = {}
  } = options;

  // Joi options
  const validationOptions = {
    abortEarly,
    allowUnknown,
    stripUnknown,
    context,
    messages: {
      'string.base': '{{#label}} bir metin olmalıdır',
      'string.empty': '{{#label}} boş olamaz',
      'string.min': '{{#label}} en az {{#limit}} karakter olmalıdır',
      'string.max': '{{#label}} en fazla {{#limit}} karakter olmalıdır',
      'string.pattern.base': '{{#label}} geçersiz format',
      'number.base': '{{#label}} bir sayı olmalıdır',
      'number.min': '{{#label}} minimum {{#limit}} olmalıdır',
      'number.max': '{{#label}} maksimum {{#limit}} olmalıdır',
      'array.base': '{{#label}} bir dizi olmalıdır',
      'array.min': '{{#label}} en az {{#limit}} eleman içermelidir',
      'array.max': '{{#label}} en fazla {{#limit}} eleman içermelidir',
      'object.base': '{{#label}} bir nesne olmalıdır',
      'any.required': '{{#label}} zorunludur',
      ...customMessages
    }
  };

  // Özel kuralları ekle
  Object.entries(additionalRules).forEach(([name, rule]) => {
    customRules[name] = rule;
  });

  return async (req, res, next) => {
    try {
      const dataToValidate = type === VALIDATION_TYPES.FILE 
        ? req.files || req.file
        : req[type];

      if (!dataToValidate) {
        throw new Error(`${type} verisi bulunamadı`);
      }

      const { error, value } = schema.validate(
        dataToValidate,
        validationOptions
      );

      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        throw createValidationError('Validation hatası', details);
      }

      // Validated değeri request'e ekle
      req[`validated${type.charAt(0).toUpperCase() + type.slice(1)}`] = value;
      next();

    } catch (error) {
      next(error);
    }
  };
};

// Özel validation şemaları
export const schemas = {
  // Auth şemaları
  auth: {
    login: Joi.object({
      email: customRules.email.required(),
      password: Joi.string().required(),
      remember: Joi.boolean()
    }),

    register: Joi.object({
      username: customRules.username.required(),
      email: customRules.email.required(),
      password: customRules.password.required(),
      confirmPassword: Joi.ref('password'),
      terms: Joi.boolean().valid(true)
    }),

    resetPassword: Joi.object({
      token: customRules.jwt.required(),
      password: customRules.password.required(),
      confirmPassword: Joi.ref('password')
    })
  },

  // User şemaları
  user: {
    update: Joi.object({
      username: customRules.username,
      email: customRules.email,
      phone: customRules.phone,
      avatar: customRules.url,
      settings: Joi.object()
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: customRules.password.required(),
      confirmPassword: Joi.ref('newPassword')
    })
  },

  // API şemaları
  api: {
    createKey: Joi.object({
      name: Joi.string().required(),
      permissions: Joi.array().items(Joi.string()),
      expiresIn: Joi.number(),
      metadata: Joi.object()
    }),

    updateKey: Joi.object({
      name: Joi.string(),
      permissions: Joi.array().items(Joi.string()),
      metadata: Joi.object()
    })
  }
};

// Validation middleware'leri
export const validateLogin = createValidator(schemas.auth.login);
export const validateRegister = createValidator(schemas.auth.register);
export const validateResetPassword = createValidator(schemas.auth.resetPassword);
export const validateUserUpdate = createValidator(schemas.user.update);
export const validateChangePassword = createValidator(schemas.user.changePassword);
export const validateCreateApiKey = createValidator(schemas.api.createKey);
export const validateUpdateApiKey = createValidator(schemas.api.updateKey);

export { VALIDATION_TYPES, customRules }; 