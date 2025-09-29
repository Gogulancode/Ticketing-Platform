import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const EmailMappingModal = ({ mapping, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    id: 0,
    categoryId: 0,
    categoryName: '',
    emailAddress: '',
    displayName: '',
    smtpServer: '',
    smtpPort: 587,
    smtpUseSsl: true,
    smtpUsername: '',
    smtpPassword: '',
    imapServer: '',
    imapPort: 993,
    imapUseSsl: true,
    imapUsername: '',
    imapPassword: '',
    isActive: true
  });

  useEffect(() => {
    if (mapping) {
      setFormData(mapping);
    }
  }, [mapping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const dataToSave = {
      ...formData,
      categoryName: selectedCategory?.name || ''
    };
    onSave(dataToSave);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return React.createElement('div', {className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'},
    React.createElement('div', {className: 'bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'},
      React.createElement('div', {className: 'flex justify-between items-center mb-4'},
        React.createElement('h3', {className: 'text-lg font-semibold'}, 
          mapping ? 'Edit Email Mapping' : 'Add Email Mapping'
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'text-gray-400 hover:text-gray-600'
        }, React.createElement(X, {className: 'h-5 w-5'}))
      ),
      React.createElement('form', {onSubmit: handleSubmit, className: 'space-y-4'},
        React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-4'},
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'Category'),
            React.createElement('select', {
              value: formData.categoryId,
              onChange: (e) => handleInputChange('categoryId', parseInt(e.target.value)),
              className: 'w-full border rounded-lg px-3 py-2',
              required: true
            },
              React.createElement('option', {value: 0}, 'Select Category'),
              categories.map(category =>
                React.createElement('option', {key: category.id, value: category.id}, category.name)
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'Display Name'),
            React.createElement('input', {
              type: 'text',
              value: formData.displayName,
              onChange: (e) => handleInputChange('displayName', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'Support Team',
              required: true
            })
          ),
          React.createElement('div', {className: 'md:col-span-2'},
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'Email Address'),
            React.createElement('input', {
              type: 'email',
              value: formData.emailAddress,
              onChange: (e) => handleInputChange('emailAddress', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'support@company.com',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'SMTP Server'),
            React.createElement('input', {
              type: 'text',
              value: formData.smtpServer,
              onChange: (e) => handleInputChange('smtpServer', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'smtp.gmail.com',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'SMTP Port'),
            React.createElement('input', {
              type: 'number',
              value: formData.smtpPort,
              onChange: (e) => handleInputChange('smtpPort', parseInt(e.target.value)),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: '587',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'IMAP Server'),
            React.createElement('input', {
              type: 'text',
              value: formData.imapServer,
              onChange: (e) => handleInputChange('imapServer', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'imap.gmail.com',
              required: true
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'IMAP Port'),
            React.createElement('input', {
              type: 'number',
              value: formData.imapPort,
              onChange: (e) => handleInputChange('imapPort', parseInt(e.target.value)),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: '993',
              required: true
            })
          )
        ),
        
        // Email Authentication Section
        React.createElement('div', {className: 'md:col-span-2 border-t pt-4 mt-4'},
          React.createElement('h4', {className: 'text-md font-semibold text-gray-800 mb-3'}, 'Email Authentication')
        ),
        React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-4'},
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'SMTP Username'),
            React.createElement('input', {
              type: 'text',
              value: formData.smtpUsername,
              onChange: (e) => handleInputChange('smtpUsername', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'your-email@gmail.com'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'SMTP Password / App Password'),
            React.createElement('input', {
              type: 'password',
              value: formData.smtpPassword,
              onChange: (e) => handleInputChange('smtpPassword', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'Enter password or App Password'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'IMAP Username'),
            React.createElement('input', {
              type: 'text',
              value: formData.imapUsername,
              onChange: (e) => handleInputChange('imapUsername', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'your-email@gmail.com'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', {className: 'block text-sm font-medium mb-1'}, 'IMAP Password / App Password'),
            React.createElement('input', {
              type: 'password',
              value: formData.imapPassword,
              onChange: (e) => handleInputChange('imapPassword', e.target.value),
              className: 'w-full border rounded-lg px-3 py-2',
              placeholder: 'Enter password or App Password'
            })
          )
        ),
        
        // SSL Configuration Section
        React.createElement('div', {className: 'md:col-span-2 border-t pt-4 mt-4'},
          React.createElement('h4', {className: 'text-md font-semibold text-gray-800 mb-3'}, 'SSL Configuration')
        ),
        React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-4'},
          React.createElement('div', {className: 'flex items-center'},
            React.createElement('input', {
              type: 'checkbox',
              id: 'smtpUseSsl',
              checked: formData.smtpUseSsl,
              onChange: (e) => handleInputChange('smtpUseSsl', e.target.checked),
              className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            React.createElement('label', {htmlFor: 'smtpUseSsl', className: 'ml-2 block text-sm text-gray-700'}, 'Use SSL for SMTP')
          ),
          React.createElement('div', {className: 'flex items-center'},
            React.createElement('input', {
              type: 'checkbox',
              id: 'imapUseSsl',
              checked: formData.imapUseSsl,
              onChange: (e) => handleInputChange('imapUseSsl', e.target.checked),
              className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            React.createElement('label', {htmlFor: 'imapUseSsl', className: 'ml-2 block text-sm text-gray-700'}, 'Use SSL for IMAP')
          ),
        
        // Status Section
        React.createElement('div', {className: 'md:col-span-2 border-t pt-4 mt-4'},
          React.createElement('div', {className: 'flex items-center'},
            React.createElement('input', {
              type: 'checkbox',
              id: 'isActive',
              checked: formData.isActive,
              onChange: (e) => handleInputChange('isActive', e.target.checked),
              className: 'h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
            }),
            React.createElement('label', {htmlFor: 'isActive', className: 'ml-2 block text-sm text-gray-700'}, 'Enable Email Processing')
          )
        ),
        
        React.createElement('div', {className: 'flex justify-end space-x-3 pt-4'},
          React.createElement('button', {
            type: 'button',
            onClick: onClose,
            className: 'px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50'
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: !formData.categoryId || !formData.emailAddress || !formData.displayName,
            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50'
          }, mapping ? 'Update' : 'Create')
        )
      )
    )
  )
);
};
