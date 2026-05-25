import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VariableEditorPanel } from '../src/renderer/src/components/VariableEditorPanel'
import type { ThemeVariable } from '../src/shared/types'
import type { ResolvedVariable } from '../src/shared/variable-resolver'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'variableEditor.title': 'Theme Variables',
        'variableEditor.source.theme': 'Theme default',
        'variableEditor.source.project': 'Project override',
        'variableEditor.source.page': 'Page override',
        'variableEditor.reset': 'Reset'
      }
      return translations[key] ?? key
    }
  })
}))

const themeVars: Record<string, ThemeVariable> = {
  mainColor: { type: 'color', default: '#000' },
  fontSize: { type: 'number', default: 16 },
  fontFamily: { type: 'string', default: 'sans-serif' }
}

const resolvedVars: Record<string, ResolvedVariable> = {
  mainColor: { value: '#000', source: 'theme' },
  fontSize: { value: 16, source: 'theme' },
  fontFamily: { value: 'sans-serif', source: 'theme' }
}

describe('VariableEditorPanel', () => {
  it('renders all theme variables', () => {
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Theme Variables')).toBeInTheDocument()
    expect(screen.getByLabelText('mainColor')).toBeInTheDocument()
    expect(screen.getByLabelText('fontSize')).toBeInTheDocument()
    expect(screen.getByLabelText('fontFamily')).toBeInTheDocument()
  })

  it('renders color input for color type', () => {
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={vi.fn()}
      />
    )
    const colorInput = screen.getByLabelText('mainColor')
    expect(colorInput).toHaveAttribute('type', 'color')
  })

  it('renders number input for number type', () => {
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={vi.fn()}
      />
    )
    const numberInput = screen.getByLabelText('fontSize')
    expect(numberInput).toHaveAttribute('type', 'number')
  })

  it('renders text input for string type', () => {
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={vi.fn()}
      />
    )
    const textInput = screen.getByLabelText('fontFamily')
    expect(textInput).toHaveAttribute('type', 'text')
  })

  it('calls onChange when value is modified', () => {
    const onChange = vi.fn()
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={onChange}
      />
    )
    const input = screen.getByLabelText('fontFamily')
    fireEvent.change(input, { target: { value: 'monospace' } })
    expect(onChange).toHaveBeenCalledWith('fontFamily', 'monospace')
  })

  it('calls onChange with number for number type', () => {
    const onChange = vi.fn()
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolvedVars}
        onChange={onChange}
      />
    )
    const input = screen.getByLabelText('fontSize')
    fireEvent.change(input, { target: { value: '24' } })
    expect(onChange).toHaveBeenCalledWith('fontSize', 24)
  })

  it('shows source badge for each variable', () => {
    const resolved: Record<string, ResolvedVariable> = {
      mainColor: { value: '#f00', source: 'project' },
      fontSize: { value: 16, source: 'theme' },
      fontFamily: { value: 'monospace', source: 'page' }
    }
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolved}
        onChange={vi.fn()}
      />
    )
    expect(screen.getByText('Project override')).toBeInTheDocument()
    expect(screen.getByText('Theme default')).toBeInTheDocument()
    expect(screen.getByText('Page override')).toBeInTheDocument()
  })

  it('shows reset button for overridden variables', () => {
    const resolved: Record<string, ResolvedVariable> = {
      mainColor: { value: '#f00', source: 'project' },
      fontSize: { value: 16, source: 'theme' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    }
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolved}
        onReset={vi.fn()}
        onChange={vi.fn()}
      />
    )
    const resetButtons = screen.getAllByText('Reset')
    expect(resetButtons).toHaveLength(1)
  })

  it('calls onReset when reset button is clicked', () => {
    const onReset = vi.fn()
    const resolved: Record<string, ResolvedVariable> = {
      mainColor: { value: '#f00', source: 'project' },
      fontSize: { value: 16, source: 'theme' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    }
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolved}
        onChange={vi.fn()}
        onReset={onReset}
      />
    )
    fireEvent.click(screen.getByText('Reset'))
    expect(onReset).toHaveBeenCalledWith('mainColor')
  })

  it('renders select input for select type with options', () => {
    const selectVars: Record<string, ThemeVariable> = {
      layout: { type: 'select', default: 'grid', options: ['grid', 'list', 'masonry'] }
    }
    const selectResolved: Record<string, ResolvedVariable> = {
      layout: { value: 'grid', source: 'theme' }
    }
    render(
      <VariableEditorPanel
        themeVariables={selectVars}
        resolved={selectResolved}
        onChange={vi.fn()}
      />
    )
    const select = screen.getByLabelText('layout')
    expect(select.tagName).toBe('SELECT')
    expect(select).toHaveValue('grid')
    const options = select.querySelectorAll('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('grid')
    expect(options[1]).toHaveTextContent('list')
    expect(options[2]).toHaveTextContent('masonry')
  })

  it('calls onChange with selected value for select type', () => {
    const onChange = vi.fn()
    const selectVars: Record<string, ThemeVariable> = {
      layout: { type: 'select', default: 'grid', options: ['grid', 'list', 'masonry'] }
    }
    const selectResolved: Record<string, ResolvedVariable> = {
      layout: { value: 'grid', source: 'theme' }
    }
    render(
      <VariableEditorPanel
        themeVariables={selectVars}
        resolved={selectResolved}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByLabelText('layout'), { target: { value: 'masonry' } })
    expect(onChange).toHaveBeenCalledWith('layout', 'masonry')
  })

  it('only shows reset for matching overrideSource', () => {
    const resolved: Record<string, ResolvedVariable> = {
      mainColor: { value: '#f00', source: 'project' },
      fontSize: { value: 24, source: 'page' },
      fontFamily: { value: 'sans-serif', source: 'theme' }
    }
    render(
      <VariableEditorPanel
        themeVariables={themeVars}
        resolved={resolved}
        onChange={vi.fn()}
        onReset={vi.fn()}
        overrideSource="page"
      />
    )
    const resetButtons = screen.getAllByText('Reset')
    expect(resetButtons).toHaveLength(1)
  })
})
