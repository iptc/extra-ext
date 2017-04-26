import uuid


class Node(object):
    tab = '\t'

    def __init__(self, data, delimiter, parent_id=None, level=0):
        self.id = str(uuid.uuid3(uuid.NAMESPACE_DNS, data))
        self.data = data
        self.delimiter = delimiter
        self.parent_id = parent_id
        self.level = level

        parts = data.split(delimiter)
        self.label = parts[-1]

        self.children = []

    def walk(self):
        yield self
        for child in self.children:
            for n in child.walk():
                yield n

    def add_child(self, obj):
        if not self.child_exists(obj):
            obj.parent_id = self.id
            obj.level = self.level + 1
            self.children.append(obj)

    def print_node(self, i=0):
        print((self.tab * i) + self.data)
        i += 1
        for child in self.children:
            child.print_node(i)

    def get_by_id(self, id):
        if self.id == id:
            return self
        else:
            for child in self.children:
                found = child.get_by_id(id)
                if found is not None:
                    return found
        return None

    def find(self, d):
        if self.data == d:
            return self
        else:
            for child in self.children:
                found = child.find(d)
                if found is not None:
                    return found
        return None

    def child_exists(self, child_node):
        for child in self.children:
            if child.data == child_node.data:
                return True
        return False

    def to_json(self):
        json_section = {
            'id': self.id,
            'section_name': self.data,
            'label': self.label,
            'level': self.level,
            'parent': self.parent_id
        }

        if len(self.children) > 0:
            ch = list()
            for child in self.children:
                ch.append(child.to_json())
                json_section['children'] = ch
        return json_section

    def collect_names(self, names_to_collect):
        parts = self.data.split(self.delimiter)
        for part in parts:
            names_to_collect.add(part)
        for child in self.children:
            child.collect_names(names_to_collect)
