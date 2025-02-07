import {
  defineComponent,
  getCurrentInstance,
  computed,
  onMounted,
  nextTick,
  ref,
  h,
} from 'vue'
import ElCheckbox from '@element-plus/components/checkbox'
import FilterPanel from '../filter-panel.vue'
import useLayoutObserver from '../layout-observer'
import { hColgroup } from '../h-helper'
import useEvent from './event-helper'
import useStyle from './style.helper'
import useUtils from './utils-helper'

import type { ComponentInternalInstance, Ref, PropType } from 'vue'
import type { DefaultRow, Sort, Table } from '../table/defaults'
import type { Store } from '../store'
export interface TableHeader extends ComponentInternalInstance {
  state: {
    onColumnsChange
    onScrollableChange
  }
  filterPanels: Ref<unknown>
}
export interface TableHeaderProps<T> {
  fixed: string
  store: Store<T>
  border: boolean
  defaultSort: Sort
}

export default defineComponent({
  name: 'ElTableHeader',
  components: {
    ElCheckbox,
  },
  props: {
    fixed: {
      type: String,
      default: '',
    },
    store: {
      required: true,
      type: Object as PropType<TableHeaderProps<DefaultRow>['store']>,
    },
    border: Boolean,
    defaultSort: {
      type: Object as PropType<TableHeaderProps<DefaultRow>['defaultSort']>,
      default: () => {
        return {
          prop: '',
          order: '',
        }
      },
    },
  },
  setup(props, { emit }) {
    const instance = getCurrentInstance() as TableHeader
    const parent = instance.parent as Table<unknown>
    const storeData = parent.store.states
    const filterPanels = ref({})
    const { tableLayout, onColumnsChange, onScrollableChange } =
      useLayoutObserver(parent)
    const hasGutter = computed(() => {
      return (
        !props.fixed &&
        tableLayout.gutterWidth > 0 &&
        tableLayout.bodyScrollHeight.value > tableLayout.bodyHeight.value
      )
    })
    const gutterWidth = computed(() => {
      return tableLayout.gutterWidth
    })
    onMounted(() => {
      nextTick(() => {
        const { prop, order } = props.defaultSort
        const init = true
        parent.store.commit('sort', { prop, order, init })
      })
    })
    const {
      handleHeaderClick,
      handleHeaderContextMenu,
      handleMouseDown,
      handleMouseMove,
      handleMouseOut,
      handleSortClick,
      handleFilterClick,
    } = useEvent(props as TableHeaderProps<unknown>, emit)
    const {
      getHeaderRowStyle,
      getHeaderRowClass,
      getHeaderCellStyle,
      getHeaderCellClass,
    } = useStyle(props as TableHeaderProps<unknown>)
    const { isGroup, toggleAllSelection, columnRows } = useUtils(
      props as TableHeaderProps<unknown>
    )

    instance.state = {
      onColumnsChange,
      onScrollableChange,
    }
    // eslint-disable-next-line
    instance.filterPanels = filterPanels

    return {
      columns: storeData.columns,
      filterPanels,
      hasGutter,
      gutterWidth,
      onColumnsChange,
      onScrollableChange,
      columnRows,
      getHeaderRowClass,
      getHeaderRowStyle,
      getHeaderCellClass,
      getHeaderCellStyle,
      handleHeaderClick,
      handleHeaderContextMenu,
      handleMouseDown,
      handleMouseMove,
      handleMouseOut,
      handleSortClick,
      handleFilterClick,
      isGroup,
      toggleAllSelection,
    }
  },
  render() {
    const {
      columns,
      isGroup,
      hasGutter,
      columnRows,
      gutterWidth,
      getHeaderCellStyle,
      getHeaderCellClass,
      getHeaderRowClass,
      getHeaderRowStyle,
      handleHeaderClick,
      handleHeaderContextMenu,
      handleMouseDown,
      handleMouseMove,
      handleSortClick,
      handleMouseOut,
      store,
      $parent,
    } = this
    let rowSpan = 1
    return h(
      'table',
      {
        border: '0',
        cellpadding: '0',
        cellspacing: '0',
        class: 'el-table__header',
      },
      [
        hColgroup(columns, hasGutter),
        h(
          'thead',
          {
            class: { 'is-group': isGroup, 'has-gutter': hasGutter },
          },
          columnRows.map((subColumns, rowIndex) =>
            h(
              'tr',
              {
                class: getHeaderRowClass(rowIndex),
                key: rowIndex,
                style: getHeaderRowStyle(rowIndex),
              },
              subColumns
                .map((column, cellIndex) => {
                  if (column.rowSpan > rowSpan) {
                    rowSpan = column.rowSpan
                  }
                  return h(
                    'th',
                    {
                      class: getHeaderCellClass(
                        rowIndex,
                        cellIndex,
                        subColumns,
                        column
                      ),
                      colspan: column.colSpan,
                      key: `${column.id}-thead`,
                      rowSpan: column.rowSpan,
                      style: getHeaderCellStyle(
                        rowIndex,
                        cellIndex,
                        subColumns,
                        column,
                        hasGutter
                      ),
                      onClick: ($event) => handleHeaderClick($event, column),
                      onContextmenu: ($event) =>
                        handleHeaderContextMenu($event, column),
                      onMousedown: ($event) => handleMouseDown($event, column),
                      onMousemove: ($event) => handleMouseMove($event, column),
                      onMouseout: handleMouseOut,
                    },
                    [
                      h(
                        'div',
                        {
                          class: [
                            'cell',
                            column.filteredValue &&
                            column.filteredValue.length > 0
                              ? 'highlight'
                              : '',
                            column.labelClassName,
                          ],
                        },
                        [
                          column.renderHeader
                            ? column.renderHeader({
                                column,
                                $index: cellIndex,
                                store,
                                _self: $parent,
                              })
                            : column.label,
                          column.sortable &&
                            h(
                              'span',
                              {
                                onClick: ($event) =>
                                  handleSortClick($event, column),
                                class: 'caret-wrapper',
                              },
                              [
                                h('i', {
                                  onClick: ($event) =>
                                    handleSortClick(
                                      $event,
                                      column,
                                      'ascending'
                                    ),
                                  class: 'sort-caret ascending',
                                }),
                                h('i', {
                                  onClick: ($event) =>
                                    handleSortClick(
                                      $event,
                                      column,
                                      'descending'
                                    ),
                                  class: 'sort-caret descending',
                                }),
                              ]
                            ),
                          column.filterable &&
                            h(FilterPanel, {
                              store: $parent.store,
                              placement:
                                column.filterPlacement || 'bottom-start',
                              column,
                              upDataColumn: (key, value) => {
                                column[key] = value
                              },
                            }),
                        ]
                      ),
                    ]
                  )
                })
                .concat(
                  hasGutter && rowIndex === 0
                    ? [
                        h(
                          'th',
                          {
                            class: 'el-table__fixed-right-patch el-table__cell',
                            key: `el-table--scrollbar`,
                            rowSpan,
                            style: {
                              width: `${gutterWidth}px`,
                            },
                          },
                          []
                        ),
                      ]
                    : []
                )
            )
          )
        ),
      ]
    )
  },
})
