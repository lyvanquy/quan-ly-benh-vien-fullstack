import { Request, Response, NextFunction } from 'express';

type Rule = {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'email' | 'uuid' | 'date';
  min?: number;
  max?: number;
  enum?: string[];
};

type Schema = Record<string, Rule>;

export function validate(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    const body = req.body;

    for (const [field, rule] of Object.entries(schema)) {
      const val = body[field];

      if (rule.required && (val === undefined || val === null || val === '')) {
        errors.push(`${field} la bat buoc`);
        continue;
      }

      if (val === undefined || val === null || val === '') continue;

      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val))) {
        errors.push(`${field} khong dung dinh dang email`);
      }

      if (rule.type === 'uuid' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val))) {
        errors.push(`${field} khong dung dinh dang UUID`);
      }

      if (rule.type === 'number' && isNaN(Number(val))) {
        errors.push(`${field} phai la so`);
      }

      if (rule.type === 'date' && isNaN(Date.parse(String(val)))) {
        errors.push(`${field} khong dung dinh dang ngay`);
      }

      if (rule.type === 'string' && rule.min && String(val).length < rule.min) {
        errors.push(`${field} phai co it nhat ${rule.min} ky tu`);
      }

      if (rule.type === 'string' && rule.max && String(val).length > rule.max) {
        errors.push(`${field} khong duoc vuot qua ${rule.max} ky tu`);
      }

      if (rule.enum && !rule.enum.includes(String(val))) {
        errors.push(`${field} phai la mot trong: ${rule.enum.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    return next();
  };
}

// Common schemas
export const schemas = {
  patient: {
    name: { required: true, type: 'string', min: 2, max: 100 },
    dob: { required: true, type: 'date' },
    gender: { required: true, enum: ['MALE', 'FEMALE', 'OTHER'] },
    phone: { required: true, type: 'string', min: 9, max: 15 },
  },
  appointment: {
    patientId: { required: true, type: 'uuid' },
    doctorId: { required: true, type: 'uuid' },
    appointmentDate: { required: true, type: 'date' },
  },
  login: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', min: 6 },
  },
} satisfies Record<string, Schema>;
