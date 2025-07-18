/**
 * @file scoped.jsx.
 * @author fex
 */

import React from 'react';
import {findDOMNode} from 'react-dom';
import {RendererProps} from 'amis-core';
import cx from 'classnames';
import hoistNonReactStatic from 'hoist-non-react-statics';
import {PopOver} from 'amis-core';
import {Overlay} from 'amis-core';
import {Icon} from 'amis-ui';
import {SchemaCollection, SchemaExpression} from '../Schema';
import {RootClose} from 'amis-core';

export interface SchemaPopOverObject {
  /**
   * 类名
   */
  className?: string;

  /**
   * 弹框外层类名
   */
  popOverClassName?: string;

  /**
   * 配置当前行是否启动，要用表达式
   */
  popOverEnableOn?: SchemaExpression;

  /**
   * 弹出模式
   */
  mode?: 'dialog' | 'drawer' | 'popOver';

  /**
   * 是弹窗形式的时候有用。
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * 弹出位置
   */
  position?:
    | 'center'
    | 'left-top'
    | 'left-top-left-top'
    | 'left-top-left-center'
    | 'left-top-left-bottom'
    | 'left-top-center-top'
    | 'left-top-center-center'
    | 'left-top-center-bottom'
    | 'left-top-right-top'
    | 'left-top-right-center'
    | 'left-top-right-bottom'
    | 'right-top'
    | 'right-top-left-top'
    | 'right-top-left-center'
    | 'right-top-left-bottom'
    | 'right-top-center-top'
    | 'right-top-center-center'
    | 'right-top-center-bottom'
    | 'right-top-right-top'
    | 'right-top-right-center'
    | 'right-top-right-bottom'
    | 'left-bottom'
    | 'left-bottom-left-top'
    | 'left-bottom-left-center'
    | 'left-bottom-left-bottom'
    | 'left-bottom-center-top'
    | 'left-bottom-center-center'
    | 'left-bottom-center-bottom'
    | 'left-bottom-right-top'
    | 'left-bottom-right-center'
    | 'left-bottom-right-bottom'
    | 'right-bottom'
    | 'right-bottom-left-top'
    | 'right-bottom-left-center'
    | 'right-bottom-left-bottom'
    | 'right-bottom-center-top'
    | 'right-bottom-center-center'
    | 'right-bottom-center-bottom'
    | 'right-bottom-right-top'
    | 'right-bottom-right-center'
    | 'right-bottom-right-bottom'
    | 'fixed-center'
    | 'fixed-left-top'
    | 'fixed-right-top'
    | 'fixed-left-bottom'
    | 'fixed-right-bottom';

  /**
   * 触发条件，默认是 click
   */
  trigger?: 'click' | 'hover';

  /**
   * 是否显示查看更多的 icon，通常是放大图标。
   */
  showIcon?: boolean;

  /**
   * 偏移量
   */
  offset?: {
    top?: number;
    left?: number;
  };

  /**
   * 标题
   */
  title?: string;

  body?: SchemaCollection;
}

export type SchemaPopOver = boolean | SchemaPopOverObject;

export interface PopOverProps extends RendererProps {
  name?: string;
  label?: string;
  popOver: boolean | SchemaPopOverObject;
  onPopOverOpened: (popover: any) => void;
  onPopOverClosed: (popover: any) => void;
  textOverflow?: 'noWrap' | 'ellipsis' | 'default';
}

export interface PopOverState {
  isOpened: boolean;
}

export const HocPopOver =
  (
    config: {
      targetOutter?: boolean; // 定位目标为整个外层
      position?: string;
    } = {}
  ) =>
  (Component: React.ComponentType<any>): any => {
    let lastOpenedInstance: PopOverComponent | null = null;
    class PopOverComponent extends React.Component<PopOverProps, PopOverState> {
      target: HTMLElement;
      timer: ReturnType<typeof setTimeout>;
      static ComposedComponent = Component;
      constructor(props: PopOverProps) {
        super(props);

        this.openPopOver = this.openPopOver.bind(this);
        this.closePopOver = this.closePopOver.bind(this);
        this.closePopOverLater = this.closePopOverLater.bind(this);
        this.clearCloseTimer = this.clearCloseTimer.bind(this);
        this.targetRef = this.targetRef.bind(this);
        // this.handleClickOutside = this.handleClickOutside.bind(this);
        this.state = {
          isOpened: false
        };
      }

      targetRef(ref: any) {
        this.target = ref;
      }

      openPopOver(event: any) {
        const onPopOverOpened = this.props.onPopOverOpened;
        lastOpenedInstance?.closePopOver();
        lastOpenedInstance = this;
        const e = event.currentTarget;
        // 如果内容不超出，不需要弹出
        if (
          (this.getClassName() === 'ellipsis' &&
            e &&
            e.clientHeight >= e.scrollHeight) ||
          this.getClassName() === 'noWrap'
        ) {
          return;
        }
        this.setState(
          {
            isOpened: true
          },
          () => onPopOverOpened && onPopOverOpened(this.props.popOver)
        );
      }

      closePopOver() {
        clearTimeout(this.timer);
        if (!this.state.isOpened) {
          return;
        }

        lastOpenedInstance = null;
        const onPopOverClosed = this.props.onPopOverClosed;
        this.setState(
          {
            isOpened: false
          },
          () => onPopOverClosed && onPopOverClosed(this.props.popOver)
        );
      }

      closePopOverLater() {
        // 5s 后自动关闭。
        this.timer = setTimeout(this.closePopOver, 500);
      }

      clearCloseTimer() {
        clearTimeout(this.timer);
      }

      buildSchema() {
        const {popOver, name, label, translate: __, column} = this.props;

        let schema;

        if (popOver === true) {
          schema = {
            type: 'panel',
            body: `\${${name}}`
          };
        } else if (
          popOver &&
          (popOver.mode === 'dialog' || popOver.mode === 'drawer')
        ) {
          schema = {
            actions: [
              {
                label: __('Dialog.close'),
                type: 'button',
                actionType: 'cancel'
              }
            ],
            ...popOver,
            type: popOver.mode
          };
        } else if (typeof popOver === 'string') {
          schema = {
            type: 'panel',
            body: popOver
          };
        } else if (popOver) {
          schema = {
            type: 'panel',
            ...popOver
          };
        } else if (this.getClassName() === 'ellipsis') {
          schema = {
            type: 'panel',
            body: column && column.type === 'mapping' ? column : `\${${name}}`
          };
        }

        return schema || 'error';
      }

      getOffset() {
        const {popOver} = this.props;

        if (!popOver || typeof popOver === 'boolean' || !popOver.offset) {
          return undefined;
        }

        // PopOver 组件接收的 offset 格式为 { x: number, y: number }
        return {
          x: popOver.offset.left || 0,
          y: popOver.offset.top || 0
        };
      }

      renderPopOver() {
        let {
          popOver,
          render,
          popOverContainer,
          classnames: cx,
          classPrefix: ns
        } = this.props;
        if (
          popOver &&
          ((popOver as SchemaPopOverObject).mode === 'dialog' ||
            (popOver as SchemaPopOverObject).mode === 'drawer')
        ) {
          return render('popover-detail', this.buildSchema(), {
            show: true,
            onClose: this.closePopOver,
            onConfirm: this.closePopOver
          });
        }

        const content = render('popover-detail', this.buildSchema(), {
          className: cx(popOver && (popOver as SchemaPopOverObject).className)
        }) as JSX.Element;

        if (!popOverContainer) {
          popOverContainer = () => findDOMNode(this);
        }

        const selectClassName = this.getClassName();
        const defaultPlacement =
          selectClassName === 'ellipsis' && !popOver ? 'auto' : 'center';
        const position =
          (popOver && (popOver as SchemaPopOverObject).position) || '';

        const isFixed = /^fixed\-/.test(position);
        return isFixed ? (
          <RootClose
            disabled={!this.state.isOpened}
            onRootClose={this.closePopOver}
          >
            {(ref: any) => {
              return (
                <div
                  className={cx(`PopOverAble--fixed PopOverAble--${position}`)}
                  onMouseLeave={
                    (popOver as SchemaPopOverObject)?.trigger === 'hover'
                      ? this.closePopOver
                      : undefined
                  }
                  onMouseEnter={
                    (popOver as SchemaPopOverObject)?.trigger === 'hover'
                      ? this.clearCloseTimer
                      : undefined
                  }
                  ref={ref}
                >
                  {content}
                </div>
              );
            }}
          </RootClose>
        ) : (
          <Overlay
            container={popOverContainer}
            placement={position || config.position || defaultPlacement}
            target={() => this.target}
            onHide={this.closePopOver}
            rootClose
            show
          >
            <PopOver
              classPrefix={ns}
              className={cx(
                'PopOverAble-popover',
                popOver && (popOver as SchemaPopOverObject).popOverClassName
              )}
              offset={this.getOffset()}
              onMouseLeave={
                (popOver as SchemaPopOverObject)?.trigger === 'hover' ||
                selectClassName
                  ? this.closePopOver
                  : undefined
              }
              onMouseEnter={
                (popOver as SchemaPopOverObject)?.trigger === 'hover' ||
                selectClassName
                  ? this.clearCloseTimer
                  : undefined
              }
            >
              {content}
            </PopOver>
          </Overlay>
        );
      }
      getClassName() {
        const {textOverflow} = this.props;
        return textOverflow === 'default' ? '' : textOverflow;
      }

      render() {
        const {
          popOver,
          popOverEnabled,
          popOverEnable,
          className,
          noHoc,
          width,
          classnames: cx,
          showIcon
        } = this.props;

        const selectClassName = this.getClassName();

        if (
          (!popOver && !selectClassName) ||
          popOverEnabled === false ||
          noHoc ||
          popOverEnable === false
        ) {
          return <Component {...this.props} />;
        }

        const triggerProps: any = {};
        const trigger = (popOver as SchemaPopOverObject)?.trigger;
        if (
          trigger === 'hover' ||
          (selectClassName === 'ellipsis' && !popOver)
        ) {
          triggerProps.onMouseEnter = this.openPopOver;
          triggerProps.onMouseLeave = this.closePopOverLater;
        } else {
          triggerProps.onClick = this.openPopOver;
        }

        return (
          <Component
            {...this.props}
            className={cx(`Field--popOverAble`, className, {
              in: this.state.isOpened
            })}
            ref={config.targetOutter ? this.targetRef : undefined}
          >
            {(popOver as SchemaPopOverObject)?.showIcon !== false && popOver ? (
              <>
                <Component {...this.props} contentsOnly noHoc />
                <span
                  key="popover-btn"
                  className={cx('Field-popOverBtn')}
                  {...triggerProps}
                  ref={config.targetOutter ? undefined : this.targetRef}
                >
                  <Icon icon="zoom-in" className="icon" />
                </span>
                {this.state.isOpened ? this.renderPopOver() : null}
              </>
            ) : (
              <>
                <div
                  className={cx(
                    'Field-popOverWrap',
                    selectClassName
                      ? 'Field-popOverWrap-' + selectClassName
                      : ''
                  )}
                  {...triggerProps}
                  ref={config.targetOutter ? undefined : this.targetRef}
                >
                  <Component {...this.props} contentsOnly noHoc />
                </div>
                {this.state.isOpened ? this.renderPopOver() : null}
              </>
            )}
          </Component>
        );
      }
    }

    hoistNonReactStatic(PopOverComponent, Component);

    return PopOverComponent;
  };

export default HocPopOver;
