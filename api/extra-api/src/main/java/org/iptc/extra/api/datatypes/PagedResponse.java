package org.iptc.extra.api.datatypes;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.annotation.XmlList;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement(name = "results")
public class PagedResponse<K> {

	private int page;
	private int nPerPage;
	private long total;

	@XmlList
	private List<K> entries = new ArrayList<K>();
	
	@XmlList
	private Map<String, Object> annotations = new HashMap<String, Object>();
	
	public PagedResponse() {
		
	}

	public int getPage() {
		return page;
	}

	public void setPage(int page) {
		this.page = page;
	}

	public int getnPerPage() {
		return nPerPage;
	}

	public void setnPerPage(int nPerPage) {
		this.nPerPage = nPerPage;
	}

	public long getTotal() {
		return total;
	}

	public void setTotal(long total) {
		this.total = total;
	}
	
	public List<K> getEntries() {
		return entries;
	}

	public void setEntries(List<K> entries) {
		this.entries = entries;
	}

	public void addAnnotation(String key, Object value) {
		annotations.put(key, value);
	}
	
	public Map<String, Object> getAnnotations() {
		return annotations;
	}
	
	public Object getAnnotation(String key) {
		return annotations.get(key);
	}
}
