import { useState } from "#app";

interface Notification {
  title: string;
  body: string;
  show: boolean;
  data?: any;
}

export const useNotification = () => {
  // Use Nuxt's useState to create shared state
  const notification = useState<Notification>("notification", () => ({
    title: "",
    body: "",
    show: false,
    data: {},
  }));

  const showNotification = (
    title: string,
    body: string,
    data: any = {},
    duration = 50000
  ) => {
    notification.value = {
      title,
      body,
      show: true,
      data,
    };

    // Auto-hide after specified duration
    if (duration > 0) {
      setTimeout(() => {
        if (notification.value.show) {
          notification.value = {
            ...notification.value,
            show: false,
          };
        }
      }, duration);
    }
  };

  const closeNotification = () => {
    notification.value = {
      ...notification.value,
      show: false,
    };
  };

  return {
    notification,
    showNotification,
    closeNotification,
  };
};
