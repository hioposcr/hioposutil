import type { MdgSettings, MdgSettingsErrors } from '../types';

export function validateMdgSettings(settings: MdgSettings): MdgSettingsErrors {
  const errors: MdgSettingsErrors = {};

  if (!/^\d+$/.test(settings.tenantId.trim())) {
    errors.tenantId = 'El tenant ID debe contener solo dígitos.';
  }

  if (!settings.password.trim()) {
    errors.password = 'La contraseña es obligatoria para solicitar el token.';
  }

  return errors;
}
