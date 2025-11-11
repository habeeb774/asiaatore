# Advanced Notifications Component

A comprehensive notification system with RTL support, auto-close functionality, and multiple positioning options.

## Features

- **Multiple notification types**: success, error, warning, info
- **RTL support**: Full right-to-left layout support for Arabic and other RTL languages
- **Auto-close**: Configurable auto-dismissal with progress bar
- **Multiple positions**: top-left, top-right, bottom-left, bottom-right, top-center, bottom-center
- **Action buttons**: Support for custom action buttons in notifications
- **Animation**: Smooth slide-in animations with RTL-aware transforms
- **Accessibility**: ARIA labels and keyboard navigation support
- **Dark mode**: Automatic dark/light theme support

## Usage

### Basic Usage

```jsx
import AdvancedNotifications from './components/AdvancedNotifications/AdvancedNotifications';
import { useAdvancedNotifications } from './components/AdvancedNotifications/AdvancedNotifications';

// In your component
const { success, error, warning, info } = useAdvancedNotifications();

// Show notifications
success('تم حفظ البيانات بنجاح!');
error('حدث خطأ في الاتصال');
warning('تحذير: البيانات غير مكتملة');
info('معلومة: تم تحديث النظام');

// Render the notification container
<AdvancedNotifications
  notifications={notifications}
  position="top-right"
  maxNotifications={5}
  autoClose={true}
  autoCloseDelay={5000}
/>
```

### Advanced Usage with Actions

```jsx
const { addNotification } = useAdvancedNotifications();

addNotification({
  type: 'warning',
  title: 'تأكيد الحذف',
  message: 'هل أنت متأكد من حذف هذا العنصر؟',
  actions: [
    {
      label: 'إلغاء',
      onClick: () => console.log('Cancelled'),
      primary: false
    },
    {
      label: 'حذف',
      onClick: () => handleDelete(),
      primary: true
    }
  ]
});
```

### Custom Positioning

```jsx
// Top right (default)
<AdvancedNotifications position="top-right" />

// Bottom left
<AdvancedNotifications position="bottom-left" />

// Top center
<AdvancedNotifications position="top-center" />

// Bottom center
<AdvancedNotifications position="bottom-center" />
```

## Props

### AdvancedNotifications Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `notifications` | Array | `[]` | Array of notification objects |
| `position` | String | `'top-right'` | Position: 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center' |
| `maxNotifications` | Number | `5` | Maximum number of visible notifications |
| `autoClose` | Boolean | `true` | Whether notifications auto-close |
| `autoCloseDelay` | Number | `5000` | Auto-close delay in milliseconds |
| `className` | String | `''` | Additional CSS classes |

### Notification Object

```jsx
{
  id: 'unique-id', // Auto-generated if not provided
  type: 'info', // 'success', 'error', 'warning', 'info'
  title: 'Notification Title', // Optional
  message: 'Notification message',
  duration: 5000, // Auto-close delay override
  actions: [ // Optional action buttons
    {
      label: 'Action Label',
      onClick: () => {},
      primary: false // Primary button styling
    }
  ]
}
```

## Hook API

### useAdvancedNotifications

Returns an object with notification management functions:

```jsx
const {
  notifications,      // Current notifications array
  addNotification,    // Add custom notification
  removeNotification, // Remove specific notification
  clearAll,          // Clear all notifications
  success,           // Show success notification
  error,             // Show error notification
  warning,           // Show warning notification
  info               // Show info notification
} = useAdvancedNotifications();
```

## Styling

The component uses Tailwind CSS classes and supports both light and dark themes. Custom styling can be applied via the `className` prop.

## RTL Support

The component automatically detects the language direction from the LanguageContext and adjusts:

- Slide-in animation direction
- Text alignment
- Button spacing
- Icon positioning

## Accessibility

- ARIA labels for close buttons
- Keyboard navigation support
- Screen reader friendly
- Focus management
- High contrast support

## Dependencies

- React
- LanguageContext (for RTL support)
- Tailwind CSS (for styling)