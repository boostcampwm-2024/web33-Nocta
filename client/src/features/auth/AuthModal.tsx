/* eslint-disable @typescript-eslint/no-unused-vars */
import { AxiosError } from "axios";
import { useState, useEffect } from "react";
import { useLoginMutation, useSignupMutation, ApiErrorResponse } from "@apis/auth";
import Lock from "@assets/icons/lock.svg?react";
import Mail from "@assets/icons/mail.svg?react";
import User from "@assets/icons/user.svg?react";
import { InputField } from "@components/inputField/InputField";
import { Modal } from "@components/modal/modal";
import {
  container,
  formContainer,
  title,
  toggleButton,
  errorContainer,
  errorWrapper,
} from "./AuthModal.style";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");

  const getErrorMessage = (error: AxiosError<ApiErrorResponse>) => {
    switch (error.response?.status) {
      case 400:
        return "입력하신 정보가 올바르지 않습니다.";
      case 401:
        return "이메일 또는 비밀번호가 올바르지 않습니다.";
      case 409:
        return "이미 사용 중인 이메일입니다.";
      default:
        return "오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  const { mutate: login } = useLoginMutation(onClose, {
    onError: (error: AxiosError<ApiErrorResponse>) => {
      setError(getErrorMessage(error));
    },
  });

  const { mutate: signUp } = useSignupMutation(
    () => {
      // 회원가입 성공 시 자동으로 로그인 시도
      const { email, password } = formData;
      login({ email, password });
    },
    {
      onError: (error: AxiosError<ApiErrorResponse>) => {
        setError(getErrorMessage(error));
      },
    },
  );

  const validateForm = (): boolean => {
    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      return false;
    }

    // 비밀번호 유효성 검사 (최소 8자)
    if (formData.password.length < 1) {
      setError("비밀번호를 입력해주세요.");
      return false;
    }

    // 회원가입 시 이름 필드 검사
    if (mode === "register" && !formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return false;
    }

    return true;
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setFormData({ email: "", password: "", name: "" });
    setError("");
  };

  const closeModal = () => {
    setMode("login");
    setFormData({ email: "", password: "", name: "" });
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitButtonClick = () => {
    if (!validateForm()) {
      return;
    }
    if (mode === "register") {
      signUp(formData);
    } else {
      login(formData);
    }
  };

  const getFieldError = (fieldName: string): boolean => {
    if (!error) return false;
    if (error === "올바른 이메일 형식이 아닙니다." && fieldName === "email") {
      return true;
    }
    if (error === "비밀번호를 입력해주세요." && fieldName === "password") {
      return true;
    }
    if (error === "이름을 입력해주세요." && fieldName === "name") {
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때마다 초기화
      setFormData({
        name: "",
        email: "",
        password: "",
      });
      setError("");
      setMode("login");
    }
  }, [isOpen]); // isOpen이 변경될 때마다 실행
  return (
    <Modal
      isOpen={isOpen}
      primaryButtonLabel={mode === "login" ? "로그인" : "회원가입"}
      primaryButtonOnClick={handleSubmitButtonClick}
      secondaryButtonLabel="취소"
      secondaryButtonOnClick={closeModal}
    >
      <div className={container}>
        <h1 className={title}>{mode === "login" ? "Login" : "Sign Up"}</h1>
        <div className={formContainer}>
          {mode === "register" && (
            <InputField
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="이름"
              Icon={User}
              isError={getFieldError("name")}
            />
          )}
          <InputField
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="이메일"
            Icon={Mail}
            isError={getFieldError("email")}
          />
          <InputField
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="비밀번호"
            Icon={Lock}
            isError={getFieldError("password")}
          />
        </div>
        <div className={errorWrapper}>{error && <p className={errorContainer}>{error}</p>}</div>
        <button onClick={toggleMode} className={toggleButton}>
          {mode === "login"
            ? "계정이 없으신가요? 회원가입하기"
            : "이미 계정이 있으신가요? 로그인하기"}
        </button>
      </div>
    </Modal>
  );
};
