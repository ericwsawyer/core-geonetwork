package jeeves.server.overrides;

import org.springframework.context.ApplicationContext;

import java.util.Properties;

class RefValueLoader implements ValueLoader {
    private String beanName;

    public RefValueLoader(String beanName) {
        this.beanName = beanName;
    }

    @Override
    public Object load(ApplicationContext context, Properties properties) {
        Object bean = context.getBean(beanName);
        if(bean == null) {
            throw new IllegalArgumentException("Could not find a bean with id: "+beanName);
        }
        return bean;
    }
}