/**
 * Entity Graph Metadata
 * Single source of truth for all entity definitions, fields, relations, and dialog config.
 * Drives: tabs, relation links, search, command palette, form rendering.
 */

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'relation' | 'boolean' | 'textarea' | 'currency';

export interface FieldMeta {
  name: string;
  label: string;
  type: FieldType;
  entity?: string;          // for relation fields
  options?: { value: string; label: string }[];
  required?: boolean;
  readOnly?: boolean;
}

export interface RelationMeta {
  entity: string;           // target entity key
  field: string;            // FK field on target e.g. "patientId"
  label: string;            // tab label
  icon?: string;
  createCtxKey?: string;    // key to pass as ctx when creating from this tab
}

export interface EntityMeta {
  entity: string;
  title: string;
  titlePlural: string;
  icon: string;             // lucide icon name
  color: string;            // tailwind color token
  apiPath: string;          // backend API path
  searchFields: string[];   // fields used in global search
  displayField: string;     // field used as display name in search results
  fields: FieldMeta[];
  relations: RelationMeta[];
  timelineSource?: boolean; // include in patient timeline
}

export const entityMetaMap: Record<string, EntityMeta> = {

  patient: {
    entity: 'patient',
    title: 'Benh nhan',
    titlePlural: 'Benh nhan',
    icon: 'Users',
    color: 'blue',
    apiPath: '/patients',
    searchFields: ['name', 'phone', 'patientCode'],
    displayField: 'name',
    fields: [
      { name: 'name',            label: 'Ho ten',        type: 'text',     required: true },
      { name: 'dob',             label: 'Ngay sinh',     type: 'date',     required: true },
      { name: 'gender',          label: 'Gioi tinh',     type: 'select',   options: [{ value: 'MALE', label: 'Nam' }, { value: 'FEMALE', label: 'Nu' }, { value: 'OTHER', label: 'Khac' }] },
      { name: 'phone',           label: 'So dien thoai', type: 'text',     required: true },
      { name: 'address',         label: 'Dia chi',       type: 'text' },
      { name: 'bloodType',       label: 'Nhom mau',      type: 'text' },
      { name: 'allergies',       label: 'Di ung',        type: 'text' },
      { name: 'chronicDiseases', label: 'Benh man tinh', type: 'textarea' },
      { name: 'insuranceId',     label: 'Ma BHYT',       type: 'text' },
    ],
    relations: [
      { entity: 'appointment', field: 'patientId', label: 'Lich kham',     icon: 'CalendarDays', createCtxKey: 'patientId' },
      { entity: 'encounter',   field: 'patientId', label: 'Dot dieu tri',  icon: 'Stethoscope',  createCtxKey: 'patientId' },
      { entity: 'lab_order',   field: 'patientId', label: 'Xet nghiem',    icon: 'FlaskConical', createCtxKey: 'patientId' },
      { entity: 'bill',        field: 'patientId', label: 'Hoa don',       icon: 'Receipt',      createCtxKey: 'patientId' },
      { entity: 'surgery',     field: 'patientId', label: 'Phau thuat',    icon: 'Scissors',     createCtxKey: 'patientId' },
      { entity: 'referral',    field: 'patientId', label: 'Chuyen vien',   icon: 'ArrowRightLeft' },
    ],
  },

  doctor: {
    entity: 'doctor',
    title: 'Bac si',
    titlePlural: 'Bac si',
    icon: 'UserRound',
    color: 'emerald',
    apiPath: '/doctors',
    searchFields: ['name', 'specialty'],
    displayField: 'name',
    fields: [
      { name: 'name',            label: 'Ho ten',         type: 'text',   required: true },
      { name: 'specialty',       label: 'Chuyen khoa',    type: 'text',   required: true },
      { name: 'experienceYears', label: 'Kinh nghiem (nam)', type: 'number' },
      { name: 'roomNumber',      label: 'Phong kham',     type: 'text' },
      { name: 'bio',             label: 'Gioi thieu',     type: 'textarea' },
    ],
    relations: [
      { entity: 'appointment', field: 'doctorId', label: 'Lich kham',    icon: 'CalendarDays' },
      { entity: 'surgery',     field: 'surgeonId', label: 'Phau thuat',  icon: 'Scissors' },
    ],
  },

  appointment: {
    entity: 'appointment',
    title: 'Lich kham',
    titlePlural: 'Lich kham',
    icon: 'CalendarDays',
    color: 'indigo',
    apiPath: '/appointments',
    searchFields: ['patientName', 'doctorName'],
    displayField: 'code',
    fields: [
      { name: 'patientId',       label: 'Benh nhan',  type: 'relation', entity: 'patient',  required: true },
      { name: 'doctorId',        label: 'Bac si',     type: 'relation', entity: 'doctor',   required: true },
      { name: 'appointmentDate', label: 'Ngay gio',   type: 'date',     required: true },
      { name: 'note',            label: 'Ghi chu',    type: 'textarea' },
    ],
    relations: [],
    timelineSource: true,
  },

  encounter: {
    entity: 'encounter',
    title: 'Dot dieu tri',
    titlePlural: 'Dot dieu tri',
    icon: 'Stethoscope',
    color: 'purple',
    apiPath: '/encounters',
    searchFields: ['encounterCode'],
    displayField: 'encounterCode',
    fields: [
      { name: 'patientId',      label: 'Benh nhan',    type: 'relation', entity: 'patient', required: true },
      { name: 'type',           label: 'Loai',         type: 'select',   options: [
        { value: 'OUTPATIENT', label: 'Ngoai tru' }, { value: 'INPATIENT', label: 'Noi tru' },
        { value: 'EMERGENCY', label: 'Cap cuu' }, { value: 'DAY_SURGERY', label: 'Phau thuat ngay' },
      ]},
      { name: 'chiefComplaint', label: 'Ly do kham',   type: 'textarea' },
    ],
    relations: [],
    timelineSource: true,
  },

  lab_order: {
    entity: 'lab_order',
    title: 'Xet nghiem',
    titlePlural: 'Xet nghiem',
    icon: 'FlaskConical',
    color: 'teal',
    apiPath: '/lab/orders',
    searchFields: [],
    displayField: 'id',
    fields: [
      { name: 'patientId', label: 'Benh nhan', type: 'relation', entity: 'patient', required: true },
      { name: 'note',      label: 'Ghi chu',   type: 'textarea' },
    ],
    relations: [],
    timelineSource: true,
  },

  bill: {
    entity: 'bill',
    title: 'Hoa don',
    titlePlural: 'Hoa don',
    icon: 'Receipt',
    color: 'amber',
    apiPath: '/bills',
    searchFields: ['billCode'],
    displayField: 'billCode',
    fields: [
      { name: 'patientId', label: 'Benh nhan', type: 'relation', entity: 'patient', required: true },
      { name: 'note',      label: 'Ghi chu',   type: 'textarea' },
    ],
    relations: [],
    timelineSource: true,
  },

  medicine: {
    entity: 'medicine',
    title: 'Thuoc',
    titlePlural: 'Kho thuoc',
    icon: 'Pill',
    color: 'pink',
    apiPath: '/medicines',
    searchFields: ['name', 'genericName', 'code'],
    displayField: 'name',
    fields: [
      { name: 'name',         label: 'Ten thuoc',    type: 'text',     required: true },
      { name: 'genericName',  label: 'Ten goc',      type: 'text' },
      { name: 'category',     label: 'Nhom thuoc',   type: 'text' },
      { name: 'price',        label: 'Don gia',      type: 'currency', required: true },
      { name: 'stock',        label: 'Ton kho',      type: 'number' },
      { name: 'unit',         label: 'Don vi',       type: 'text' },
      { name: 'manufacturer', label: 'Nha san xuat', type: 'text' },
    ],
    relations: [],
  },

  bed: {
    entity: 'bed',
    title: 'Giuong benh',
    titlePlural: 'Giuong benh',
    icon: 'BedDouble',
    color: 'orange',
    apiPath: '/beds',
    searchFields: ['code'],
    displayField: 'code',
    fields: [
      { name: 'code',   label: 'Ma giuong', type: 'text', required: true },
      { name: 'status', label: 'Trang thai', type: 'select', options: [
        { value: 'AVAILABLE', label: 'Trong' }, { value: 'OCCUPIED', label: 'Co benh nhan' },
        { value: 'RESERVED', label: 'Da dat' }, { value: 'MAINTENANCE', label: 'Bao tri' },
      ]},
    ],
    relations: [],
  },

  surgery: {
    entity: 'surgery',
    title: 'Phau thuat',
    titlePlural: 'Phau thuat',
    icon: 'Scissors',
    color: 'red',
    apiPath: '/surgery',
    searchFields: ['procedureName'],
    displayField: 'procedureName',
    fields: [
      { name: 'patientId',      label: 'Benh nhan',    type: 'relation', entity: 'patient',  required: true },
      { name: 'surgeonId',      label: 'Phau thuat vien', type: 'relation', entity: 'doctor', required: true },
      { name: 'procedureName',  label: 'Ten phau thuat', type: 'text',   required: true },
      { name: 'scheduledStart', label: 'Bat dau du kien', type: 'date',  required: true },
      { name: 'anesthesiaType', label: 'Loai gay me',   type: 'text' },
      { name: 'preOpNote',      label: 'Ghi chu truoc PT', type: 'textarea' },
    ],
    relations: [],
    timelineSource: true,
  },

  referral: {
    entity: 'referral',
    title: 'Chuyen vien',
    titlePlural: 'Chuyen vien',
    icon: 'ArrowRightLeft',
    color: 'cyan',
    apiPath: '/referrals',
    searchFields: ['reason'],
    displayField: 'reason',
    fields: [
      { name: 'patientId',    label: 'Benh nhan',    type: 'relation', entity: 'patient', required: true },
      { name: 'toDepartment', label: 'Khoa tiep nhan', type: 'text' },
      { name: 'toFacility',   label: 'Co so tiep nhan', type: 'text' },
      { name: 'reason',       label: 'Ly do',        type: 'textarea', required: true },
      { name: 'urgency',      label: 'Muc do',       type: 'select', options: [
        { value: 'ROUTINE', label: 'Thuong' }, { value: 'URGENT', label: 'Khan' }, { value: 'EMERGENCY', label: 'Cap cuu' },
      ]},
    ],
    relations: [],
    timelineSource: true,
  },

  consent: {
    entity: 'consent',
    title: 'Dong thuan',
    titlePlural: 'Dong thuan',
    icon: 'FileCheck',
    color: 'lime',
    apiPath: '/consent',
    searchFields: ['type'],
    displayField: 'type',
    fields: [
      { name: 'patientId', label: 'Benh nhan', type: 'relation', entity: 'patient', required: true },
      { name: 'type',      label: 'Loai',      type: 'select', options: [
        { value: 'GENERAL', label: 'Tong quat' }, { value: 'SURGERY', label: 'Phau thuat' },
        { value: 'ANESTHESIA', label: 'Gay me' }, { value: 'RESEARCH', label: 'Nghien cuu' },
      ]},
      { name: 'content', label: 'Noi dung', type: 'textarea', required: true },
    ],
    relations: [],
  },

  teleconsult: {
    entity: 'teleconsult',
    title: 'Kham tu xa',
    titlePlural: 'Kham tu xa',
    icon: 'Video',
    color: 'violet',
    apiPath: '/telemedicine',
    searchFields: [],
    displayField: 'id',
    fields: [
      { name: 'patientId',   label: 'Benh nhan', type: 'relation', entity: 'patient', required: true },
      { name: 'doctorId',    label: 'Bac si',    type: 'relation', entity: 'doctor',  required: true },
      { name: 'scheduledAt', label: 'Thoi gian', type: 'date',     required: true },
    ],
    relations: [],
  },

  workflow_node: {
    entity: 'workflow_node',
    title: 'Workflow Node',
    titlePlural: 'Workflow Nodes',
    icon: 'GitBranch',
    color: 'slate',
    apiPath: '/nodes',
    searchFields: ['title', 'key'],
    displayField: 'title',
    fields: [
      { name: 'title', label: 'Tieu de', type: 'text', required: true },
      { name: 'type',  label: 'Loai',    type: 'select', options: [
        { value: 'PAGE', label: 'Page' }, { value: 'DIALOG', label: 'Dialog' },
        { value: 'FORM', label: 'Form' }, { value: 'DECISION', label: 'Decision' },
        { value: 'TEXT', label: 'Text' }, { value: 'ACTION', label: 'Action' },
      ]},
    ],
    relations: [],
  },
};

/** Get metadata for an entity */
export function getEntityMeta(entity: string): EntityMeta | undefined {
  return entityMetaMap[entity];
}

/** Get all relations for an entity */
export function getEntityRelations(entity: string): RelationMeta[] {
  return entityMetaMap[entity]?.relations ?? [];
}

/** All searchable entities */
export const searchableEntities = Object.values(entityMetaMap).filter(m => m.searchFields.length > 0);

/** All entities that appear in patient timeline */
export const timelineEntities = Object.values(entityMetaMap).filter(m => m.timelineSource);
