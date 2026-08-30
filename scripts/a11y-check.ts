#!/usr/bin/env ts-node
/**
 * Accessibility Check Script
 * Scans components for common accessibility issues
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

interface A11yIssue {
  file: string
  line: number
  severity: 'error' | 'warning'
  rule: string
  message: string
  code: string
}

const issues: A11yIssue[] = []

// Accessibility patterns to check
const A11Y_RULES = [
  {
    name: 'img-alt',
    pattern: /<img(?![^>]*alt=)/gi,
    severity: 'error' as const,
    message: 'Image missing alt attribute',
  },
  {
    name: 'button-content',
    pattern: /<button[^>]*>\s*<\/button>/gi,
    severity: 'error' as const,
    message: 'Button has no accessible content',
  },
  {
    name: 'anchor-content',
    pattern: /<a[^>]*>\s*<\/a>/gi,
    severity: 'error' as const,
    message: 'Link has no accessible content',
  },
  {
    name: 'click-events-keyboard',
    pattern: /onClick=.*(?!onKeyPress|onKeyDown)/gi,
    severity: 'warning' as const,
    message: 'Click handler without keyboard handler',
  },
  {
    name: 'heading-order',
    pattern: /<h[1-6]/gi,
    severity: 'warning' as const,
    message: 'Manual check: Verify heading hierarchy',
  },
  {
    name: 'label-for-input',
    pattern: /<input(?![^>]*aria-label)(?![^>]*id=)/gi,
    severity: 'error' as const,
    message: 'Input missing label or aria-label',
  },
  {
    name: 'aria-label',
    pattern: /aria-label=["']['"]/gi,
    severity: 'error' as const,
    message: 'Empty aria-label',
  },
  {
    name: 'tabindex-positive',
    pattern: /tabIndex=["']?[1-9]/gi,
    severity: 'warning' as const,
    message: 'Positive tabIndex - disrupts natural tab order',
  },
  {
    name: 'autoplay',
    pattern: /<video[^>]*autoPlay|<audio[^>]*autoPlay/gi,
    severity: 'warning' as const,
    message: 'Autoplay media - provide user control',
  },
  {
    name: 'role-redundant',
    pattern: /<button[^>]*role=["']button["']/gi,
    severity: 'warning' as const,
    message: 'Redundant role on button',
  },
]

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  A11Y_RULES.forEach(({ name, pattern, severity, message }) => {
    lines.forEach((line, index) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import')) return

      if (pattern.test(line)) {
        issues.push({
          file: filePath.replace(process.cwd(), ''),
          line: index + 1,
          severity,
          rule: name,
          message,
          code: line.trim(),
        })
      }
    })
  })
}

function scanDirectory(dir: string) {
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)

    // Skip node_modules, .next, test files
    if (
      entry === 'node_modules' ||
      entry === '.next' ||
      entry === '.git' ||
      entry.includes('.test.') ||
      entry.includes('.spec.')
    ) {
      continue
    }

    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      scanDirectory(fullPath)
    } else if (entry.match(/\.(tsx|jsx)$/)) {
      scanFile(fullPath)
    }
  }
}

// Run scan
console.log('♿ Running accessibility scan...\n')
const componentsDir = join(process.cwd(), 'src', 'components')
const appDir = join(process.cwd(), 'src', 'app')

if (statSync(componentsDir).isDirectory()) scanDirectory(componentsDir)
if (statSync(appDir).isDirectory()) scanDirectory(appDir)

// Group by severity
const errors = issues.filter(i => i.severity === 'error')
const warnings = issues.filter(i => i.severity === 'warning')

// Report
console.log(`Found ${issues.length} potential accessibility issues:\n`)

if (errors.length > 0) {
  console.log(`❌ ERRORS (${errors.length}):`)
  errors.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`  [${issue.rule}] ${issue.message}`)
    console.log(`  ${issue.code}\n`)
  })
}

if (warnings.length > 0) {
  console.log(`⚠️  WARNINGS (${warnings.length}):`)
  warnings.forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`)
    console.log(`  [${issue.rule}] ${issue.message}`)
  })
  console.log()
}

// Manual checks
console.log('\n✋ Manual Accessibility Checks Required:\n')
console.log('Keyboard Navigation:')
console.log('  [ ] All interactive elements focusable')
console.log('  [ ] Focus visible on all elements')
console.log('  [ ] Tab order is logical')
console.log('  [ ] Escape closes modals/dropdowns')
console.log('  [ ] Enter/Space activates buttons\n')

console.log('Screen Reader:')
console.log('  [ ] Test with NVDA/VoiceOver')
console.log('  [ ] Heading hierarchy correct')
console.log('  [ ] Form labels announced')
console.log('  [ ] Error messages announced')
console.log('  [ ] Dynamic content updates announced\n')

console.log('Visual:')
console.log('  [ ] Color contrast meets WCAG AA (4.5:1)')
console.log('  [ ] Text resizable to 200%')
console.log('  [ ] No information by color alone')
console.log('  [ ] Focus indicators visible\n')

console.log('Motion:')
console.log('  [ ] Respects prefers-reduced-motion')
console.log('  [ ] Animations can be disabled')
console.log('  [ ] No auto-playing content\n')

// Recommendations
console.log('📚 Recommended Tools:\n')
console.log('  • axe DevTools (browser extension)')
console.log('  • WAVE (browser extension)')
console.log('  • Lighthouse (Chrome DevTools)')
console.log('  • Pa11y (automated testing)')
console.log('  • NVDA/VoiceOver (screen readers)\n')

// Exit code
if (errors.length > 0) {
  console.log(`\n❌ Found ${errors.length} accessibility errors`)
  console.log('Fix errors before deployment\n')
  process.exit(1)
} else if (warnings.length > 0) {
  console.log(`\n⚠️  Found ${warnings.length} accessibility warnings`)
  console.log('Review warnings and complete manual checks\n')
  process.exit(0)
} else {
  console.log('✅ No automated accessibility issues found')
  console.log('Complete manual checks before deployment\n')
  process.exit(0)
}
