# -*- coding: utf-8 -*-

import json

class DrawWidget:
    def __init__(self):
        """DrawWidget constructor"""
        self.world_bounds = (-10, -10, 20, 20)  # xmin, ymin, width, height
        self._update_transform()

        self.__stroke_color = 'black'
        self.__fill_color = 'white'
        self.__stroke_width = 1.0
        self.__text_color = 'black'

        self.extents = [0, 0, 0, 0]
        self.display_list = []

    def __reset_extents(self):
        """Reset extents"""
        self.extents = [0, 0, 0, 0]

    def __update_extents(self, x, y):
        """Update extents"""
        self.extents[0] = min(self.extents[0], float(x))
        self.extents[1] = min(self.extents[1], float(y))
        self.extents[2] = max(self.extents[2], float(x))
        self.extents[3] = max(self.extents[3], float(y))

    def __update_extents_points(self, points):
        """Update extents with points"""
        for p in points:
            self.__update_extents(p[0], p[1])

    def _update_transform(self):
        """Update the transformation matrix between world and window coordinates"""
        self.transform = {
            'scale': 1,
            'translate': (0, 0)
        }
        # Implement the transformation logic here if needed

    def draw(self):
        """Draw the widget"""
        self.display_list = []
        self.on_draw()

    def on_draw(self):
        """Method to implement drawing in subclasses"""
        pass

    def set_world_bounds(self, xmin: float, ymin: float, width: float, height: float):
        """Update world coordinates"""
        self.world_bounds = (xmin, ymin, width, height)
        self._update_transform()

    def window_to_world(self, x, y):
        """Convert window coordinates to world coordinates"""
        # Implement the conversion logic here if needed
        return x, y

    def world_to_window(self, x, y):
        """Convert world coordinates to window coordinates"""
        # Implement the conversion logic here if needed
        return x, y

    def polygon(self, points):
        """Draw a polygon with points"""
        self.__update_extents_points(points)
        self.display_list.append({
            'type': 'polygon',
            'points': points,
            'stroke_color': self.__stroke_color,
            'fill_color': self.__fill_color,
            'stroke_width': self.__stroke_width
        })

    def line(self, x1, y1, x2, y2):
        """Draw a line"""
        self.__update_extents(x1, y1)
        self.__update_extents(x2, y2)
        self.display_list.append({
            'type': 'line',
            'x1': float(x1),
            'y1': float(y1),
            'x2': float(x2),
            'y2': float(y2),
            'stroke_color': self.__stroke_color,
            'stroke_width': self.__stroke_width
        })

    def arrow(self, x1, y1, x2, y2, arrow_size=5, arrow_start=True, arrow_end=True):
        """Draw an arrow"""
        self.__update_extents(x1, y1)
        self.__update_extents(x2, y2)
        self.display_list.append({
            'type': 'arrow',
            'x1': float(x1),
            'y1': float(y1),
            'x2': float(x2),
            'y2': float(y2),
            'arrow_size': arrow_size,
            'arrow_start': arrow_start,
            'arrow_end': arrow_end,
            'stroke_color': self.__stroke_color,
            'stroke_width': self.__stroke_width
        })

    def rect(self, x, y, w, h):
        """Draw a rectangle"""
        self.__update_extents(x, y)
        self.__update_extents(x + w, y + h)

        self.display_list.append({
            'type': 'rect',
            'x': float(x),
            'y': float(y),
            'width': float(w),
            'height': float(h),
            'stroke_color': self.__stroke_color,
            'fill_color': self.__fill_color,
            'stroke_width': self.__stroke_width
        })

    def circle(self, x, y, r):
        """Draw a circle"""
        self.__update_extents(x - r, y - r)
        self.__update_extents(x + r, y + r)

        self.display_list.append({
            'type': 'circle',
            'x': float(x),
            'y': float(y),
            'radius': float(r),
            'stroke_color': self.__stroke_color,
            'fill_color': self.__fill_color,
            'stroke_width': self.__stroke_width
        })

    def triangle(self, x, y, w, h):
        """Draw a triangle"""
        self.__update_extents(x, y)
        self.__update_extents(x + w, y + h)

        self.display_list.append({
            'type': 'triangle',
            'x': float(x),
            'y': float(y),
            'width': float(w),
            'height': float(h),
            'stroke_color': self.__stroke_color,
            'fill_color': self.__fill_color,
            'stroke_width': self.__stroke_width
        })

    def text(self, x, y, text, font_size=12, hor_align="center", vert_align="middle"):
        """Draw text in world coordinates with screen pixel size for the font"""
        self.__update_extents(x, y)

        self.display_list.append({
            'type': 'text',
            'x': float(x),
            'y': float(y),
            'text': text,
            'font_size': font_size,
            'hor_align': hor_align,
            'vert_align': vert_align,
            'color': self.__text_color
        })

    def clear(self):
        """Clear the display list"""
        self.display_list = []
        self.__reset_extents()
    
    def to_json(self):
        """Return widget as json string"""
        widget_dict = {
            'stroke_color': self.__stroke_color,
            'fill_color': self.__fill_color,
            'stroke_width': self.__stroke_width,
            'text_color': self.__text_color,
            'extents': self.extents,
            'display_list': self.display_list
        }

        return json.dumps(widget_dict)   

    @property
    def stroke_color(self):
        return self.__stroke_color

    @stroke_color.setter
    def stroke_color(self, color):
        self.__stroke_color = color

    @property
    def fill_color(self):
        return self.__fill_color

    @fill_color.setter
    def fill_color(self, color):
        self.__fill_color = color

    @property
    def stroke_width(self):
        return self.__stroke_width

    @stroke_width.setter
    def stroke_width(self, width):
        self.__stroke_width = width

    @property
    def text_color(self):
        return self.__text_color

    @text_color.setter
    def text_color(self, color):
        self.__text_color = color
