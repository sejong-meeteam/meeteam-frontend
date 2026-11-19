import BaseInput from '@/components/shared/BaseInput';
import BaseField from '@/components/shared/BaseField';

type ProfileSectionProps = {
  birth: string;
  gender: string;
  onChangeBirth: (value: string) => void;
  onChangeGender: React.ChangeEventHandler<HTMLInputElement>;
  birthError?: string;
};

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_DATE = `${CURRENT_YEAR - 90}-01-01`;
const MAX_BIRTH_DATE = `${CURRENT_YEAR - 14}-12-31`;

export default function ProfileSection({
  birth,
  gender,
  onChangeBirth,
  onChangeGender,
  birthError,
}: ProfileSectionProps) {
  return (
    <>
      <BaseField label="생년월일" htmlFor="birth" errorText={birthError}>
        <BaseInput
          id="birth"
          type="date"
          value={birth}
          min={MIN_BIRTH_DATE}
          max={MAX_BIRTH_DATE}
          onChange={(event) => onChangeBirth(event.target.value)}
          error={Boolean(birthError)}
          data-cy="signup-birth"
        />
      </BaseField>
      <div>
        <BaseField label="성별" htmlFor="gender">
          <div className="flex h-13 justify-center rounded-xl bg-mt-bg-soft p-1">
            <div className="flex-1">
              <input
                type="radio"
                id="male"
                value="male"
                name="gender"
                className="peer hidden"
                checked={gender === 'male'}
                onChange={onChangeGender}
                data-cy="signup-gender-male"
              />
              <label
                htmlFor="male"
                className="flex items-center justify-center rounded-lg font-bold cursor-pointer h-11
                   text-mt-text-secondary
                   peer-checked:border peer-checked:border-mt-border peer-checked:text-mt-primary peer-checked:bg-mt-white peer-checked:shadow-sm"
              >
                남성
              </label>
            </div>
            <div className="flex-1">
              <input
                type="radio"
                id="female"
                value="female"
                name="gender"
                className="peer hidden"
                checked={gender === 'female'}
                onChange={onChangeGender}
                data-cy="signup-gender-female"
              />
              <label
                htmlFor="female"
                className="flex items-center justify-center rounded-lg font-bold cursor-pointer h-11
                   text-mt-text-secondary
                   peer-checked:border peer-checked:border-mt-border peer-checked:text-mt-primary peer-checked:bg-mt-white peer-checked:shadow-sm"
              >
                여성
              </label>
            </div>
          </div>
        </BaseField>
      </div>
    </>
  );
}
